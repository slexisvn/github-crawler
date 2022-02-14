export class CreateCrawlRequestDto {
  readonly endCursors: string[];
  readonly isDone: boolean;
  readonly repoUrl: string;
  readonly createdAt: number;
}
