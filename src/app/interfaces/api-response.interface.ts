export interface ApiResponse<T> {
    success: boolean;
    created: boolean;
    status: number;
    message: string;
    data: T;
  }
  