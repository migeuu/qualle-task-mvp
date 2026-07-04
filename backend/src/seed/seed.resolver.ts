import { Resolver, Mutation } from '@nestjs/graphql';
import { SeedService } from './seed.service';
import { SeedResult } from './dto/seed-result.type';
import { Public } from '../shared/decorators/public.decorator';

@Resolver()
export class SeedResolver {
  constructor(private readonly seedService: SeedService) {}

  @Mutation(() => SeedResult)
  @Public()
  async fillSeed(): Promise<SeedResult> {
    return this.seedService.execute();
  }
}
