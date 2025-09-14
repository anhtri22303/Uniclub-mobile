import z from "zod";

/**
 * Login form data request
 */
export const loginFormDataRequest = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});
export type ILoginFormDataRequest = z.infer<typeof loginFormDataRequest>;
//-----------------End-Login-Request-----------------//