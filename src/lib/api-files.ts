import { api } from "./http";

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  size?: number;
}

interface UploadImageResponse {
  success: boolean;
  data: UploadedImage;
}

interface UploadMultipleResponse {
  success: boolean;
  data: Array<Omit<UploadedImage, "size">>;
}

export async function uploadImage(file: File, folder?: string): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) formData.append("folder", folder);

  const { data } = await api.post<UploadImageResponse>("/files/upload/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data.data;
}

export async function uploadMultipleImages(
  files: File[],
  folder?: string,
): Promise<UploadMultipleResponse["data"]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (folder) formData.append("folder", folder);

  const { data } = await api.post<UploadMultipleResponse>("/files/upload/multiple", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data.data;
}

export async function deleteFile(publicId: string): Promise<void> {
  await api.delete(`/files/${encodeURIComponent(publicId)}`);
}

export async function deleteMultipleFiles(publicIds: string[]): Promise<void> {
  await api.post(
    "/files/delete/multiple",
    { publicIds },
  );
}

