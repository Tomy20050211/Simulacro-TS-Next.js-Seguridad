import { NextResponse } from 'next/server';

import type { ApiError, ApiResponse } from '@/types/api';

export function jsonSuccess<T>(data: T, message = 'OK', status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, message, data }, { status });
}

export function jsonError(message: string, status = 400, errors?: Record<string, string>) {
  const payload: ApiError = {
    success: false,
    message,
    ...(errors ? { errors } : {}),
  };

  return NextResponse.json(payload, { status });
}
