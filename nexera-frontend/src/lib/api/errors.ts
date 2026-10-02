export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public statusText: string,
    public data: any,
    public endpoint: string,
  ) {
    super(`[${statusCode}] ${endpoint}: ${data?.message || statusText}`);
    this.name = 'ApiError';
  }

  get isUnauthorized() { return this.statusCode === 401; }
  get isForbidden() { return this.statusCode === 403; }
  get isNotFound() { return this.statusCode === 404; }
  get isValidation() { return this.statusCode === 400 || this.statusCode === 422; }
  get isServerError() { return this.statusCode >= 500; }
}
