import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class GitDaemonCronService {
  /*
    POST /daemon/request => [R1, R2, R3,..]

    INTERVAL => Pick request, run for 100 users
  */
  @Cron(CronExpression.EVERY_HOUR)
  // Chay moi 00:00, 01:00, 02:00, 03:00,.....
  async crawlProfiles() {
    // 1. Lấy crawl request (mới nhất) nào chưa chạy xong (isDone = false)
    // Khi nào là xong: xong là khi crawlRequest.isDone = true
    // .find({ isDone: false, nextCursor: { $nin: [null] }, { $orderBy: { createdAt: -1 }})

    // 2. Chạy 100 người, lưu từng người vào database nếu người đó chưa ton tai
    // (Goi API len github.)
    
    // 3. Update nextCursor, neu khong con nguoi thi update isDone = true
  }
}
