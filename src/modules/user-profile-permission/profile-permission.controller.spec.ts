import { Test, TestingModule } from '@nestjs/testing';
import { ProfilePermissionController } from './profile-permission.controller';

describe('ProfilePermissionController', () => {
  let controller: ProfilePermissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilePermissionController],
    }).compile();

    controller = module.get<ProfilePermissionController>(ProfilePermissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
