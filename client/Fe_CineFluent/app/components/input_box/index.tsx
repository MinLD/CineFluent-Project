"use client";

import { Eye, EyeOff } from "lucide-react";
import { ComponentType, SVGProps, useState } from "react";

type Props = {
  type: string;
  placeholder?: string;
  id?: string;
  label?: string;
  Formik?: any;
  name?: string;
  value?: string;
  disabled?: boolean;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};
function InputBox({
  icon: Icon,
  type,
  placeholder,
  id = "",
  label,
  Formik,
  name,
}: Props) {
  const messageErr = Formik?.errors[name!];
  const [showPassword, setShowPassword] = useState(false);
  console.log(messageErr);
  return (
    <div key={id}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>

        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          )}
          <input
            type={showPassword ? "text" : type}
            name={name}
            value={Formik?.values[name!] || ""}
            onChange={Formik.handleChange}
            onBlur={Formik.handleBlur}
            className="outline-none w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            placeholder={placeholder}
            required
          />
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        <div className="h-3 w-full">
          {Formik.touched[name!] && Formik.errors[name!] && (
            <span className="text-red-500 text-[12px] font-medium">
              *{Formik.errors[name!]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default InputBox;
