import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { CrawlRequest } from "./crawlRequest.schema";

@Controller("/api")
export class GitDaemonController {
  @Post("/daemon/request")
  async addRequest(@Body() body, @Res() res: Response) {
    console.log(body)

    const repoUrl = body.repoUrl

    if (repoUrl) {
      const foundRequest = CrawlRequest.find({ repoUrl: repoUrl })
      if (!foundRequest) return res.status(400).json({
        message: 'Already exists'
      })
    }
    // 1. Check if request already exists in database (crawlRequests)
    // if yes, return error, if no, continue


    // 2. Save request in database
    // new CrawlRequest()
    const newRequest = new CrawlRequest()
    newRequest.repoUrl = repoUrl
    newRequest.isDone = false
    newRequest.nextCursor = null
    newRequest.createdAt = new Date()
    await newRequest.save()


    return res.status(201).json({
      message: 'Success'
    })
  }

}
