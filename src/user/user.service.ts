import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment';
import { convertArrayToCSV } from 'convert-array-to-csv';
import { Octokit } from '@octokit/core';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import {
  PageAfter,
  PageAfterDocument,
} from '../pageAfter/schemas/pageAfter.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(PageAfter.name)
    private readonly pageAfterModel: Model<PageAfterDocument>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  private readonly logger = new Logger(User.name);

  async getUsers(repoUrl: string, pageAfterArg: string | null = null) {
    try {
      let hasNextPage = true;
      let rateLimitRemaing = 7;
      let pageAfter = pageAfterArg;
      const users = [];
      const [repoOwner, repoName] = repoUrl.split('/');
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

      while (rateLimitRemaing > 1 && hasNextPage) {
        const { repository, rateLimit } = await octokit.graphql(
          `
            query ($name: String!, $owner: String!, $commitSince: GitTimestamp!, $commitUntil: GitTimestamp! $pageAfter: String) {
              repository(name: $name, owner: $owner) {
                stargazers(first: 2, after: $pageAfter) {
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
            pageAfter,
          },
        );

        hasNextPage = repository.stargazers.pageInfo.hasNextPage;
        pageAfter = repository.stargazers.pageInfo.endCursor;
        rateLimitRemaing -= rateLimit.cost;

        const tempUsers = repository.stargazers.edges.map(edge => {
          const fullName = edge.node.name ? edge.node.name.split(' ') : [];
          const openRepos = [];
          const langs = [];
          const miscKeywords = [];
          let totalCommits = 0;

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

          return {
            login: edge.node.login,
            repoUrl,
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
          };
        });

        users.push(...tempUsers);
      }
      await this.userModel.create(users);

      if (pageAfter) {
        await this.pageAfterModel.create({
          value: pageAfter,
          hasNextPage,
          createdAt: moment().valueOf(),
          repoUrl,
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

  async createUsers({ repoUrl }: CreateUserDto) {
    if (!repoUrl) {
      return;
    }

    await this.getUsers(repoUrl);

    const job = new CronJob(`15 * * * * *`, async () => {
      const data = await this.pageAfterModel
        .find({ repoUrl })
        .sort({ createdAt: -1 })
        .lean();
      const firstData = data[0];

      if (firstData.hasNextPage) {
        await this.getUsers(repoUrl, firstData.value);
        this.logger.debug(`Cron job is called after 30 minutes`);
      } else {
        this.schedulerRegistry.getCronJob('crawl').stop();
        this.logger.debug(`Stop a cron job`);
      }
    });

    this.schedulerRegistry.addCronJob('crawl', job);
    job.start();
    this.logger.debug(`Start a cron job`);
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
      mkdirSync('files')
    }

    writeFileSync('files/users.csv', convertArrayToCSV(formatUsers), 'utf8');
  }
}
