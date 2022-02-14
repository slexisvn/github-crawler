import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment';
import { convertArrayToCSV } from 'convert-array-to-csv';
import { Octokit } from '@octokit/core';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { CreateRequestDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import {
  CrawlRequest,
  CrawlRequestDocument,
} from '../crawlRequest/schemas/crawlRequest.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(CrawlRequest.name)
    private readonly crawlRequestModel: Model<CrawlRequestDocument>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  private readonly logger = new Logger(User.name);

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    try {
      const regex = /^https:\/\/github\.com\/(\w+)\/([\w-]+)(\/|)$/;
      const crawlRequests = await this.crawlRequestModel.find({
        isDone: false,
        nextCursor: { $nin: [null] },
        $orderBy: { createdAt: -1 },
      });

      if (crawlRequests.length < 1) {
        this.logger.log('No request');
        return;
      }

      let hasNextPage = true;
      let totalUsers = 2;
      const firstRequest = crawlRequests[0];
      let endCursor = firstRequest.endCursors[0];
      const users = [];
      const repoOwner = firstRequest.repoUrl.replace(regex, '$1');
      const repoName = firstRequest.repoUrl.replace(regex, '$2');
      const startLasthMonth = moment()
        .add(-1, 'months')
        .startOf('months')
        .format('YYYY-MM-DDTHH:MM:SSZ');
      const endLasthMonth = moment()
        .add(-1, 'months')
        .endOf('months')
        .startOf('days')
        .format('YYYY-MM-DDTHH:MM:SSZ');
      const octokit = new Octokit({
        auth: process.env.PERSONAL_TOKEN,
      });

      while (totalUsers > 1 && hasNextPage) {
        const { repository } = await octokit.graphql(
          `
            query ($name: String!, $owner: String!, $commitSince: GitTimestamp!, $commitUntil: GitTimestamp! $endCursor: String) {
              repository(name: $name, owner: $owner) {
                stargazers(first: 1, after: $endCursor) {
                  totalCount
                  pageInfo {
                    endCursor
                    hasNextPage
                    startCursor
                  }
                  edges {
                    node {
                      login
                      url
                      name
                      location
                      email
                      followers {
                        totalCount
                      }
                      isHireable
                      repositories(first: 50) {
                        totalCount
                        edges {
                          node {
                            name
                            url
                            isFork
                            forkCount
                            stargazerCount
                            parent {
                              url
                              forkCount
                              stargazerCount
                            }
                            defaultBranchRef {
                              target {
                                ... on Commit {
                                  history(since: $commitSince, until: $commitUntil) {
                                    totalCount
                                    nodes {
                                      author {
                                        user {
                                          login
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            repositoryTopics(first: 10) {
                              edges {
                                node {
                                  topic {
                                    name
                                  }
                                }
                              }
                            }
                            languages(first: 2) {
                              edges {
                                node {
                                  name
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              rateLimit {
                limit
                cost
                remaining
                resetAt
              }
            }
            `,
          {
            name: repoName,
            owner: repoOwner,
            commitSince: startLasthMonth,
            commitUntil: endLasthMonth,
            endCursor,
          },
        );

        hasNextPage = repository.stargazers.pageInfo.hasNextPage;
        endCursor = repository.stargazers.pageInfo.endCursor;
        totalUsers--;

        const edge = repository.stargazers.edges[0];
        const fullName = edge.node.name ? edge.node.name.split(' ') : [];
        const openRepos = [];
        const langs = [];
        const miscKeywords = [];
        let totalCommits = 0;

        const user = await this.userModel.findOne({
          login: edge.node.login,
        });

        if (user) {
          this.logger.log(`${user.login} already exists in the ${user.repoUrl}`);
          continue;
        }

        edge.node.repositories.edges.forEach(edRepo => {
          const tempMiscKeywords = edRepo.node.repositoryTopics.edges.map(
            edTopic => edTopic.node.topic.name,
          );

          miscKeywords.push(...tempMiscKeywords);

          if (edRepo.node.stargazerCount > 5) {
            const tempLangs = edRepo.node.languages.edges.map(
              edLang => edLang.node.name,
            );
            langs.push(...tempLangs);
          }

          if (edRepo.node.defaultBranchRef) {
            totalCommits +=
              edRepo.node.defaultBranchRef.target.history.nodes.filter(
                node => node.author?.user?.login === edge.node.login,
              ).length;
          }

          if (
            edRepo.node.isFork &&
            edRepo.node.parent &&
            edRepo.node.parent.forkCount > 5 &&
            edRepo.node.parent.stargazerCount > 5
          ) {
            openRepos.push(edRepo.node);
          }
        });

        this.logger.log(
          `get the user ${edge.node.login} out of ${repository.stargazers.totalCount} users - ${firstRequest.repoUrl}`,
        );

        users.push({
          login: edge.node.login,
          repoUrl: firstRequest.repoUrl,
          firstName: fullName[0] || null,
          lastName: fullName[fullName.length - 1] || null,
          location: edge.node.location,
          email: edge.node.email,
          profileLink: edge.node.url,
          repos: edge.node.repositories.totalCount,
          followers: edge.node.followers.totalCount,
          openToNewOpportunities: !!edge.node.isHireable,
          activityLevel: totalCommits,
          activeInOpenSource: openRepos.length > 0,
          languages: [...new Set(langs)],
          miscKeywords: [...new Set(miscKeywords)],
        });
      }
      await this.userModel.create(users);
      await this.crawlRequestModel.updateOne(
        { _id: firstRequest._id },
        {
          $set: {
            endCursors: [endCursor, ...firstRequest.endCursors],
            isDone: !hasNextPage,
          },
        },
      );
    } catch (e) {
      console.log(e);
    }
  }

  async createRequest({ repoUrl }: CreateRequestDto): Promise<HttpStatus> {
    const foundRequest = await this.crawlRequestModel
      .findOne({ repoUrl })
      .lean();

    if (foundRequest) {
      return HttpStatus.BAD_REQUEST;
    }

    await this.crawlRequestModel.create({
      repoUrl,
      isDone: false,
      endCursors: [null],
      createdAt: moment().valueOf(),
    });

    return HttpStatus.OK;
  }

  async createCSVFile(): Promise<void> {
    const users = await this.userModel.find({}).lean();
    const formatUsers = users.map(res => {
      const {
        languages,
        miscKeywords,
        firstName,
        lastName,
        location,
        email,
        profileLink,
        repos,
        followers,
        openToNewOpportunities,
        activeInOpenSource,
        activityLevel,
      } = res;

      return {
        'First Name': firstName,
        'Last Name': lastName,
        Location: location,
        Email: email,
        'Profile Link': profileLink,
        Repos: repos,
        Followers: followers,
        'Activity Level': activityLevel,
        'Open To New Opportunities': openToNewOpportunities,
        'Active In Open Source': activeInOpenSource,
        Languages: languages.join(', '),
        'Misc Keywords / Frameworks': miscKeywords.join(', '),
      };
    });

    if (!existsSync('files')) {
      mkdirSync('files');
    }

    writeFileSync('files/users.csv', convertArrayToCSV(formatUsers), 'utf8');
  }
}
