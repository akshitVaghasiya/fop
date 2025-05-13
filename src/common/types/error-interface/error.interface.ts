export interface DatabaseError extends Error {
  driverError: {
    code: string;
    detail: string;
  };
}

export interface HttpError extends Error {
  response: {
    message: string | string[];
  };
}
