import { DeleteUserSkillAction, UpdateUserSkillAction } from "@/app/lib/actions/skills";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { I_skills_user } from "@/app/lib/types/categories";
import { Button, Modal, Form, Input, Upload, Popconfirm } from "antd";
import { ExternalLink, Upload as UploadIcon, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type UpdateSkillProps = {
  isUpdateSkillModalOpen: boolean;
  setIsUpdateSkillModalOpen: (open: boolean) => void;
  skill: I_skills_user;
};

export const UpdateSkill = ({
  isUpdateSkillModalOpen,
  setIsUpdateSkillModalOpen,
  skill,
}: UpdateSkillProps) => {
  const [updatingSkill, setUpdatingSkill] = useState(false);
  // State để kiểm tra form có thay đổi hay không
  const [isChanged, setIsChanged] = useState(false);

  const { token } = useAuth();
  const [form] = Form.useForm();

  // Đổ dữ liệu cũ vào form khi mở modal
  useEffect(() => {
    if (isUpdateSkillModalOpen && skill) {
      form.setFieldsValue({
        proof_link: skill.proof_link,
        avatar: [],
      });
      // Reset trạng thái thay đổi mỗi khi mở modal
      setIsChanged(false);
    }
  }, [isUpdateSkillModalOpen, skill, form]);

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const handleUpdateSkill = async () => {
    try {
      const values = await form.validateFields();
      setUpdatingSkill(true);

      const formData = new FormData();
      if (values.proof_link) {
        formData.append("proof_link", values.proof_link);
      }
      const avatarFile = values.avatar?.[0]?.originFileObj;
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await UpdateUserSkillAction(formData, token || "", skill.id);

      if (res.success) {
        toast.success("Cập nhật kỹ năng thành công!");
        setIsUpdateSkillModalOpen(false);
        form.resetFields();
        setIsChanged(false); // Reset lại sau khi update thành công
      } else {
        toast.error(String(res.error) || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Submit Failed:", error);
    } finally {
      setUpdatingSkill(false);
    }
  };

  // Hàm xử lý xóa (Logic bạn tự viết sau)
  const handleDeleteSkill = async () => {
    console.log("Đang xóa kỹ năng ID:", skill.id);
    try {
      const res = await DeleteUserSkillAction(token || "", skill.id);
      if (res.success) {
        toast.success("Xóa kỹ năng thành công!");
        setIsUpdateSkillModalOpen(false);
        form.resetFields();
        setIsChanged(false); // Reset lại sau khi update thành công
      } else {
        toast.error(String(res.error) || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Submit Failed:", error);
    }
  };

  const handleCancel = () => {
    setIsUpdateSkillModalOpen(false);
    form.resetFields();
    setIsChanged(false);
  };

  return (
    <Modal
      title="Cập nhật kỹ năng"
      open={isUpdateSkillModalOpen}
      onCancel={handleCancel}
      centered
      // Tùy chỉnh Footer để thêm nút Xóa và disable nút Update
      footer={
        <div className="flex justify-between items-center w-full">
          {/* Nút Xóa nằm bên trái */}
          <Popconfirm
            title="Xóa kỹ năng này?"
            description="Hành động này không thể hoàn tác."
            onConfirm={handleDeleteSkill}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<Trash2 size={16} />}>
              Xóa
            </Button>
          </Popconfirm>

          {/* Các nút hành động nằm bên phải */}
          <div className="flex gap-2">
            <Button onClick={handleCancel}>Hủy bỏ</Button>
            <Button
              type="primary"
              onClick={handleUpdateSkill}
              loading={updatingSkill}
              disabled={!isChanged} // Disable nếu chưa có thay đổi
            >
              Cập nhật
            </Button>
          </div>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        // Sự kiện này kích hoạt khi bất kỳ field nào thay đổi
        onValuesChange={() => setIsChanged(true)}
      >
        <Form.Item
          label="Link minh chứng (Ảnh/Chứng chỉ)"
          name="proof_link"
          tooltip="Đường dẫn đến ảnh chứng chỉ hoặc sản phẩm của bạn (Tùy chọn)"
          rules={[{ type: "url", message: "Vui lòng nhập đúng định dạng URL" }]}
        >
          <Input
            prefix={<ExternalLink size={14} className="text-gray-400" />}
            placeholder="https://example.com/chung-chi.jpg"
          />
        </Form.Item>

        <Form.Item
          label="Ảnh minh chứng (Upload)"
          name="avatar"
          tooltip="Upload ảnh minh chứng (Bắt buộc)"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          rules={[
            { required: true, message: "Vui lòng upload ảnh minh chứng!" },
          ]}
        >
          <Upload
            maxCount={1}
            listType="picture"
            beforeUpload={() => false}
            accept="image/*"
          >
            <Button icon={<UploadIcon size={16} />}>Click to Upload</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};
