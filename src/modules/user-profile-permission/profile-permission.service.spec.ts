import { Test, TestingModule } from '@nestjs/testing';
import { ProfilePermissionService } from './profile-permission.service';

describe('ProfilePermissionService', () => {
  let service: ProfilePermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfilePermissionService],
    }).compile();

    service = module.get<ProfilePermissionService>(ProfilePermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
