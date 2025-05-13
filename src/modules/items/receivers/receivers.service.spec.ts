import { Test, TestingModule } from '@nestjs/testing';
import { ReceiversService } from './receivers.service';

describe('ReceiversService', () => {
  let service: ReceiversService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReceiversService],
    }).compile();

    service = module.get<ReceiversService>(ReceiversService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
