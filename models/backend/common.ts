import { z } from "zod";

export const BackendResponseModel = <T extends z.ZodTypeAny>(dataModel: T) =>
    z.object({
        statusCode: z.number().optional(),
        message: z.string().optional(),
        error: z.string().optional(),
        data: dataModel.optional(),
    }).refine(
        (obj) =>
            (obj.statusCode === 201 && obj.data !== undefined && obj.error === undefined) ||
            (obj.statusCode !== 201 && obj.data === undefined && obj.error !== undefined),
        {
            message: "Invalid response structure",
            path: [],
        }
    );
export type IBackendResponse<T extends z.ZodTypeAny> = z.infer<ReturnType<typeof BackendResponseModel<T>>>;