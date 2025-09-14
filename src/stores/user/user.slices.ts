
export const createUserSlice = (
    set: any
): ZUSTAND.IUserState => ({
    email: "",

    setEmail: (email: string) => set({ email }),
})

// Cần khai báo set bên ngoài slice nếu bạn dùng slice độc lập
let set: any
export const bindSet = (_set: any) => {
    set = _set
}