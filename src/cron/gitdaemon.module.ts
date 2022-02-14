import { Module } from "@nestjs/common";
import { GitDaemonController } from "./gitdaemon.controller";
import { GitDaemonCronService } from "./gitdaemon.service.cron";

@Module({
  providers: [GitDaemonCronService],
  controllers: [GitDaemonController],
})
export default class GitDaemonModule {}
