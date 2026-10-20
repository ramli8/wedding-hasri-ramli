import { queryOptions } from "@tanstack/react-query";
import { api } from "./api.js";

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: api.me,
  staleTime: 60_000,
  retry: false,
});
