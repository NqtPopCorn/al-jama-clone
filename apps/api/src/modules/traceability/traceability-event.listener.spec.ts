import { Test, TestingModule } from '@nestjs/testing';
import { TraceabilityEventListener } from './traceability-event.listener';
import { TraceabilityService } from './traceability.service';
import { ItemUpdatedEvent } from '../item/events/item-events';

describe('TraceabilityEventListener (AC-02 / QT-02)', () => {
  let listener: TraceabilityEventListener;
  let traceabilityService: any;

  const itemId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const projectId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    traceabilityService = {
      triggerSuspectFlagForUpstreamChange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TraceabilityEventListener,
        { provide: TraceabilityService, useValue: traceabilityService },
      ],
    }).compile();

    listener = module.get<TraceabilityEventListener>(TraceabilityEventListener);
  });

  it('should call triggerSuspectFlagForUpstreamChange when item.updated event is received', async () => {
    traceabilityService.triggerSuspectFlagForUpstreamChange.mockResolvedValue(2);

    const event = new ItemUpdatedEvent(itemId, projectId, userId, 3);
    await listener.handleItemUpdated(event);

    expect(traceabilityService.triggerSuspectFlagForUpstreamChange).toHaveBeenCalledWith(
      itemId,
      'Item updated to version 3',
    );
  });

  it('should handle errors gracefully without throwing', async () => {
    traceabilityService.triggerSuspectFlagForUpstreamChange.mockRejectedValue(
      new Error('DB connection failed'),
    );

    const event = new ItemUpdatedEvent(itemId, projectId, userId, 2);
    // Should not throw
    await expect(listener.handleItemUpdated(event)).resolves.not.toThrow();
  });
});
