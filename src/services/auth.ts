import { axiosClient } from "@configs/axios"

const authService = {
    login: async (data: any) => {
        return axiosClient.post('/auth/login', data)
    },
}

export default authService