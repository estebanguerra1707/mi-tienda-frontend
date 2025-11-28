import http from "@/lib/http";

type LoginDto = { email: string; password: string };
type LoginResp = {
  token: string;
  rol?: string;
  branchId?: number;
  businessType?: string | number;
  email?:string;
  username?:string;
  id:number;
};

export async function loginApi(dto: LoginDto): Promise<LoginResp> {
  const { data } = await http.post<LoginResp>("/auth/login", dto);
  return data;
}

// opcional
export async function logoutApi(): Promise<void> {
  await http.post("/auth/logout");
  return Promise.resolve();
}