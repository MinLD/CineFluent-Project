from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta

from ..extensions import db
from ..models.models_model import (
    GrammarBranch,
    GrammarTag,
    UserDiscoveredTag,
    UserKnowledgeState,
    UserTagMastery,
)
from ..services.kt_inference_service import dkt_engine
from ..utils.grammar_catalog import DISCOVERY_SOURCE_LABELS, GRAMMAR_TAG_PRESENTATION


def _safe_tag_presentation(tag: GrammarTag) -> dict:
    catalog = GRAMMAR_TAG_PRESENTATION.get(tag.id, {})
    return {
        "label_en": catalog.get("label_en") or tag.name_en or f"Tag {tag.id}",
        "label_vi": catalog.get("label_vi") or tag.name_vi or f"Tag {tag.id}",
    }


def _calculate_decayed_mastery(mastery: UserTagMastery | None) -> float:
    if not mastery:
        return 0.0

    return float(
        dkt_engine.calculate_decay_score(
            mastery.mastery_score,
            mastery.last_practiced_at,
            mastery.interval_days,
        )
    )


def _calculate_review_priority(mastery: UserTagMastery | None, decayed_mastery: float) -> float:
    if not mastery:
        return 0.0

    weakness_score = max(0.0, 100.0 - decayed_mastery)

    elapsed_days = max(
        0.0,
        (datetime.utcnow() - mastery.last_practiced_at).total_seconds() / 86400,
    )
    due_ratio = elapsed_days / max(float(mastery.interval_days or 1.0), 1.0)
    overdue_bonus = min(40.0, max(0.0, due_ratio - 1.0) * 20.0)

    return round(min(100.0, weakness_score * 0.7 + overdue_bonus), 2)


def _resolve_node_state(decayed_mastery: float) -> str:
    if decayed_mastery >= 80.0:
        return "mastered"
    return "discovered"


def _build_history_counts(user_id: str) -> dict[int, int]:
    knowledge_state = UserKnowledgeState.query.filter_by(user_id=user_id).first()
    if not knowledge_state or not knowledge_state.latent_state:
        return {}

    counts: dict[int, int] = defaultdict(int)
    for item in knowledge_state.latent_state:
        if not isinstance(item, (list, tuple)) or not item:
            continue
        try:
            tag_id = int(item[0])
        except (TypeError, ValueError):
            continue
        counts[tag_id] += 1
    return counts


def discover_learning_tag_service(user_id: str, tag_id: int, source: str = "movie"):
    grammar_tag = GrammarTag.query.get(tag_id)
    if not grammar_tag:
        return {"success": False, "error": "Không tìm thấy grammar tag", "code": 404}

    normalized_source = (source or "movie").strip().lower()
    if normalized_source not in DISCOVERY_SOURCE_LABELS:
        normalized_source = "movie"

    discovered = UserDiscoveredTag.query.filter_by(user_id=user_id, tag_id=tag_id).first()
    if discovered:
        discovered.encounter_count += 1
        discovered.last_seen_at = datetime.utcnow()
        discovered.source = normalized_source
    else:
        discovered = UserDiscoveredTag(
            user_id=user_id,
            tag_id=tag_id,
            source=normalized_source,
            encounter_count=1,
        )
        db.session.add(discovered)

    db.session.commit()

    presentation = _safe_tag_presentation(grammar_tag)
    return {
        "success": True,
        "data": {
            "tag_id": grammar_tag.id,
            "label_en": presentation["label_en"],
            "label_vi": presentation["label_vi"],
            "source": normalized_source,
            "source_label": DISCOVERY_SOURCE_LABELS.get(normalized_source),
            "encounter_count": discovered.encounter_count,
            "discovered_at": discovered.discovered_at.isoformat() if discovered.discovered_at else None,
            "last_seen_at": discovered.last_seen_at.isoformat() if discovered.last_seen_at else None,
        },
    }


def get_learning_tree_service(user_id: str):
    branches = (
        GrammarBranch.query.order_by(GrammarBranch.display_order.asc(), GrammarBranch.id.asc()).all()
    )
    grammar_tags = GrammarTag.query.order_by(GrammarTag.id.asc()).all()
    tag_map = {tag.id: tag for tag in grammar_tags}
    discovered_rows = (
        UserDiscoveredTag.query.filter_by(user_id=user_id)
        .order_by(UserDiscoveredTag.discovered_at.asc(), UserDiscoveredTag.id.asc())
        .all()
    )
    mastery_rows = UserTagMastery.query.filter_by(user_id=user_id).all()
    mastery_map = {row.tag_id: row for row in mastery_rows}
    discovered_map = {row.tag_id: row for row in discovered_rows}
    history_counts = _build_history_counts(user_id)

    total_tags_by_branch: dict[int, int] = defaultdict(int)
    for tag in grammar_tags:
        if tag.branch_id is not None:
            total_tags_by_branch[tag.branch_id] += 1

    branch_payload: dict[int, dict] = {
        branch.id: {
            "branch_id": branch.id,
            "name_en": branch.name_en,
            "name_vi": branch.name_vi,
            "description": branch.description,
            "display_order": branch.display_order,
            "discovered_count": 0,
            "locked_count": total_tags_by_branch.get(branch.id, 0),
            "mastered_count": 0,
            "tags": [],
        }
        for branch in branches
    }

    for discovered in discovered_rows:
        tag = discovered.grammar_tag
        if not tag or not tag.branch_id or tag.branch_id not in branch_payload:
            continue

        mastery = mastery_map.get(tag.id)
        decayed_mastery = _calculate_decayed_mastery(mastery)
        review_priority = _calculate_review_priority(mastery, decayed_mastery)
        node_state = _resolve_node_state(decayed_mastery)
        presentation = _safe_tag_presentation(tag)

        node = {
            "tag_id": tag.id,
            "name_en": tag.name_en,
            "name_vi": tag.name_vi,
            "label_en": presentation["label_en"],
            "label_vi": presentation["label_vi"],
            "state": node_state,
            "mastery_score": round(decayed_mastery, 2),
            "review_priority": review_priority,
            "encounter_count": max(discovered.encounter_count, history_counts.get(tag.id, 0)),
            "source": discovered.source,
            "source_label": DISCOVERY_SOURCE_LABELS.get(discovered.source, discovered.source),
            "discovered_at": discovered.discovered_at.isoformat() if discovered.discovered_at else None,
            "last_seen_at": discovered.last_seen_at.isoformat() if discovered.last_seen_at else None,
            "last_practiced_at": mastery.last_practiced_at.isoformat() if mastery and mastery.last_practiced_at else None,
            "interval_days": float(mastery.interval_days) if mastery else None,
        }

        branch_node = branch_payload[tag.branch_id]
        branch_node["tags"].append(node)
        branch_node["discovered_count"] += 1
        branch_node["locked_count"] = max(0, branch_node["locked_count"] - 1)
        if node_state == "mastered":
            branch_node["mastered_count"] += 1

    for mastery in mastery_rows:
        if mastery.tag_id in discovered_map:
            continue

        tag = tag_map.get(mastery.tag_id)
        if not tag or not tag.branch_id or tag.branch_id not in branch_payload:
            continue

        decayed_mastery = _calculate_decayed_mastery(mastery)
        review_priority = _calculate_review_priority(mastery, decayed_mastery)
        node_state = _resolve_node_state(decayed_mastery)
        presentation = _safe_tag_presentation(tag)

        node = {
            "tag_id": tag.id,
            "name_en": tag.name_en,
            "name_vi": tag.name_vi,
            "label_en": presentation["label_en"],
            "label_vi": presentation["label_vi"],
            "state": node_state,
            "mastery_score": round(decayed_mastery, 2),
            "review_priority": review_priority,
            "encounter_count": max(1, history_counts.get(tag.id, 0)),
            "source": "quiz",
            "source_label": DISCOVERY_SOURCE_LABELS.get("quiz"),
            "discovered_at": mastery.created_at.isoformat() if mastery.created_at else None,
            "last_seen_at": mastery.last_practiced_at.isoformat() if mastery.last_practiced_at else None,
            "last_practiced_at": mastery.last_practiced_at.isoformat() if mastery.last_practiced_at else None,
            "interval_days": float(mastery.interval_days) if mastery else None,
        }

        branch_node = branch_payload[tag.branch_id]
        branch_node["tags"].append(node)
        branch_node["discovered_count"] += 1
        branch_node["locked_count"] = max(0, branch_node["locked_count"] - 1)
        if node_state == "mastered":
            branch_node["mastered_count"] += 1

    discovered_branches = []
    for branch in branch_payload.values():
        if not branch["tags"]:
            continue

        branch["tags"] = sorted(
            branch["tags"],
            key=lambda item: (
                0 if item["state"] == "mastered" else 1,
                item["tag_id"],
            ),
        )
        discovered_branches.append(branch)

    discovered_total = sum(branch["discovered_count"] for branch in discovered_branches)
    mastered_total = sum(branch["mastered_count"] for branch in discovered_branches)

    return {
        "success": True,
        "data": {
            "overview": {
                "discovered_total": discovered_total,
                "mastered_total": mastered_total,
                "total_tags": len(grammar_tags),
                "branch_count": len(branches),
                "discovered_branch_count": len(discovered_branches),
            },
            "branches": discovered_branches,
        },
    }


def get_learning_tree_summary_service(user_id: str):
    tree_result = get_learning_tree_service(user_id)
    if not tree_result.get("success"):
        return tree_result

    payload = tree_result.get("data") or {}
    branches = payload.get("branches") or []
    discovered_tags = [tag for branch in branches for tag in branch.get("tags", [])]
    discovered_rows = UserDiscoveredTag.query.filter_by(user_id=user_id).all()
    recent_cutoff = datetime.utcnow() - timedelta(days=7)

    weak_tags = sorted(
        [tag for tag in discovered_tags if tag["review_priority"] > 0],
        key=lambda item: (-item["review_priority"], item["mastery_score"], item["tag_id"]),
    )[:3]

    due_tags = [tag for tag in discovered_tags if tag["review_priority"] >= 40.0]
    newly_discovered = [
        row for row in discovered_rows if row.discovered_at and row.discovered_at >= recent_cutoff
    ]

    weakest_branch = None
    weakest_branch_score = None
    for branch in branches:
        if not branch.get("tags"):
            continue

        avg_mastery = sum(tag["mastery_score"] for tag in branch["tags"]) / len(branch["tags"])
        if weakest_branch_score is None or avg_mastery < weakest_branch_score:
            weakest_branch_score = avg_mastery
            weakest_branch = {
                "branch_id": branch["branch_id"],
                "name_en": branch["name_en"],
                "name_vi": branch["name_vi"],
                "average_mastery": round(avg_mastery, 2),
            }

    today_focus = weak_tags[0] if weak_tags else None

    return {
        "success": True,
        "data": {
            "overview": payload.get("overview"),
            "weakest_branch": weakest_branch,
            "weak_tags": weak_tags,
            "due_count": len(due_tags),
            "new_discoveries_last_7_days": len(newly_discovered),
            "today_focus": today_focus,
        },
    }
