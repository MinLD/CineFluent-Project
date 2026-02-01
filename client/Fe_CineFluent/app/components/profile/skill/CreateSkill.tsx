import { getSkillsByCategoryAction } from "@/app/lib/actions/categories";
import { CreateUserSkillAction } from "@/app/lib/actions/skills";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { SHCHEMA_SkillUser } from "@/app/lib/schemas";
import { I_category, I_skill } from "@/app/lib/types/categories";
import { Button, Modal, Form, Input, Select, Upload, message } from "antd";
import { ExternalLink, Upload as UploadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const { Option } = Select;

type CreateSkillProps = {
  isAddSkillModalOpen: boolean;
  setIsAddSkillModalOpen: (open: boolean) => void;
  categories: I_category[];
};

export const CreateSkill = ({
  isAddSkillModalOpen,
  setIsAddSkillModalOpen,
  categories,
}: CreateSkillProps) => {
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<I_skill[]>([]);
  const [creatingSkill, setCreatingSkill] = useState(false);

  const { token } = useAuth();
  const [form] = Form.useForm();

  const handleCategoryChange = async (categoryId: string) => {
    form.setFieldsValue({ skill_id: undefined });
    setLoadingSkills(true);
    try {
      const res = await getSkillsByCategoryAction(categoryId);
      if (res.success && res.data) {
        setAvailableSkills(res.data);
      } else {
        toast.error("Không thể tải danh sách kỹ năng");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSkills(false);
    }
  };

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const handleCreateSkill = async () => {
    try {
      const values = await form.validateFields();
      setCreatingSkill(true);

      const formData = new FormData();
      formData.append("skill_id", String(values.skill_id));
      formData.append("level", values.level);
      if (values.proof_link) {
        formData.append("proof_link", values.proof_link);
      }

      // With normFile, values.avatar is the fileList
      const avatarFile = values.avatar?.[0]?.originFileObj;
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      // Important: Pass FormData, not JSON object
      const res = await CreateUserSkillAction(formData, token || "");

      if (res.success) {
        toast.success("Thêm kỹ năng thành công!");
        setIsAddSkillModalOpen(false);
        form.resetFields();
      } else {
        toast.error(String(res.error) || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Submit Failed:", error);
    } finally {
      setCreatingSkill(false);
    }
  };

  return (
    <Modal
      title="Thêm kỹ năng mới"
      open={isAddSkillModalOpen}
      onCancel={() => {
        setIsAddSkillModalOpen(false);
        form.resetFields();
      }}
      onOk={handleCreateSkill}
      confirmLoading={creatingSkill}
      centered
      okText="Thêm mới"
      cancelText="Hủy bỏ"
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="Danh mục kỹ năng"
          name="category_id"
          rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
        >
          <Select
            placeholder="Chọn danh mục"
            onChange={handleCategoryChange}
            showSearch
            optionFilterProp="children"
          >
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Kỹ năng"
          name="skill_id"
          rules={[{ required: true, message: "Vui lòng chọn kỹ năng" }]}
        >
          <Select
            placeholder="Chọn kỹ năng"
            loading={loadingSkills}
            disabled={!availableSkills.length}
            showSearch
            optionFilterProp="children"
          >
            {availableSkills.map((skill) => (
              <Option key={skill.id} value={skill.id}>
                {skill.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Trình độ"
          name="level"
          initialValue="beginner"
          rules={[{ required: true, message: "Vui lòng chọn trình độ" }]}
        >
          <Select placeholder="Chọn trình độ">
            <Option value="beginner">Beginner (Cơ bản)</Option>
            <Option value="intermediate">Intermediate (Trung bình)</Option>
            <Option value="advanced">Advanced (Nâng cao)</Option>
            <Option value="expert">Expert (Chuyên gia)</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Link minh chứng (Ảnh/Chứng chỉ)"
          name="proof_link"
          tooltip="Đường dẫn đến ảnh chứng chỉ hoặc sản phẩm của bạn (Tùy chọn)"
        >
          <Input
            prefix={<ExternalLink size={14} className="text-gray-400" />}
            placeholder="https://example.com/chung-chi.jpg"
          />
        </Form.Item>

        <Form.Item
          label="Ảnh minh chứng (Upload)"
          name="avatar"
          tooltip="Upload ảnh minh chứng (Tùy chọn)"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload
            maxCount={1}
            listType="picture"
            beforeUpload={() => false} // Prevent auto upload
          >
            <Button icon={<UploadIcon size={16} />}>Click to Upload</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};
