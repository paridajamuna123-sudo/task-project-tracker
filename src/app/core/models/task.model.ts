export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  localId: string;
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
  priority: TaskPriority;
  dueDate: string;
}

export interface CreateTaskInput {
  todo: string;
  userId: number;
  priority: TaskPriority;
  dueDate: string;
}

export interface DummyJsonTodoDto {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}

export interface DummyJsonTodosResponse {
  todos: DummyJsonTodoDto[];
  total: number;
  skip: number;
  limit: number;
}

export interface DummyJsonMetadataItem {
  userId: number;
  completed: boolean;
}

export interface DummyJsonMetadataResponse {
  todos: DummyJsonMetadataItem[];
  total: number;
  skip: number;
  limit: number;
}
