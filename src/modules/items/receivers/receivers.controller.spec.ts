import { Test, TestingModule } from '@nestjs/testing';
import { ReceiversController } from './receivers.controller';

describe('ReceiversController', () => {
  let controller: ReceiversController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReceiversController],
    }).compile();

    controller = module.get<ReceiversController>(ReceiversController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
