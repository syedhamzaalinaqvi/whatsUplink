
export type FormState = {
  message: string;
  errors?: Record<string, string[] | undefined> | undefined;
  success?: boolean;
  newGroupId?: string;
  pending?: boolean;
};
