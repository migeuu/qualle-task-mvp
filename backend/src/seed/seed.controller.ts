import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../shared/decorators/public.decorator';
import { SeedService } from './seed.service';
import { SeedResult } from './dto/seed-result.type';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Fill database with seed data (only works on empty database)',
  })
  @ApiResponse({ status: 201, description: 'Seed applied', type: SeedResult })
  @ApiResponse({ status: 409, description: 'Seed already applied' })
  fillSeed(): Promise<SeedResult> {
    return this.seedService.execute();
  }
}
