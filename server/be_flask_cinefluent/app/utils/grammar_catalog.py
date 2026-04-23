DISCOVERY_BRANCHES = [
    {
        "id": 1,
        "name_en": "present_tenses",
        "name_vi": "Hiện tại",
        "description": "Các thì hiện tại dùng trong ngữ cảnh giao tiếp thường ngày.",
        "display_order": 1,
    },
    {
        "id": 2,
        "name_en": "past_tenses",
        "name_vi": "Quá khứ",
        "description": "Các thì quá khứ xuất hiện trong hội thoại phim.",
        "display_order": 2,
    },
    {
        "id": 3,
        "name_en": "future_tenses",
        "name_vi": "Tương lai",
        "description": "Các thì tương lai mà người học khám phá qua phim.",
        "display_order": 3,
    },
]

TAG_BRANCH_MAPPING = {
    0: 3,
    1: 3,
    2: 3,
    3: 3,
    4: 2,
    5: 2,
    6: 2,
    7: 2,
    8: 1,
    9: 1,
    10: 1,
    11: 1,
}

GRAMMAR_TAG_PRESENTATION = {
    0: {"label_en": "Future Simple", "label_vi": "Thì tương lai đơn"},
    1: {"label_en": "Future Continuous", "label_vi": "Thì tương lai tiếp diễn"},
    2: {"label_en": "Future Perfect", "label_vi": "Thì tương lai hoàn thành"},
    3: {"label_en": "Future Perfect Continuous", "label_vi": "Thì tương lai hoàn thành tiếp diễn"},
    4: {"label_en": "Past Simple", "label_vi": "Thì quá khứ đơn"},
    5: {"label_en": "Past Continuous", "label_vi": "Thì quá khứ tiếp diễn"},
    6: {"label_en": "Past Perfect", "label_vi": "Thì quá khứ hoàn thành"},
    7: {"label_en": "Past Perfect Continuous", "label_vi": "Thì quá khứ hoàn thành tiếp diễn"},
    8: {"label_en": "Present Simple", "label_vi": "Thì hiện tại đơn"},
    9: {"label_en": "Present Continuous", "label_vi": "Thì hiện tại tiếp diễn"},
    10: {"label_en": "Present Perfect", "label_vi": "Thì hiện tại hoàn thành"},
    11: {"label_en": "Present Perfect Continuous", "label_vi": "Thì hiện tại hoàn thành tiếp diễn"},
}

DISCOVERY_SOURCE_LABELS = {
    "movie": "Khám phá qua phim",
    "quiz": "Khám phá qua quiz",
    "daily_lesson": "Khám phá qua bài học hằng ngày",
}
