import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createUserSlice } from './user.slices'


export const useUserStore = create<ZUSTAND.IUserState>()(
    devtools(
        (set, get, api) => ({
            ...createUserSlice(set),
        }),
    )
)