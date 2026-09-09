import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ItemUpdatedEvent } from '../item/events/item-events';
import { TraceabilityService } from './traceability.service';

@Injectable()
export class TraceabilityEventListener {
  private readonly logger = new Logger(TraceabilityEventListener.name);

  constructor(private readonly traceabilityService: TraceabilityService) {}

  /**
   * QT-02: Automated Suspect Flagging on Upstream Change.
   * Strictly 1 level downstream - handled in TraceabilityService.
   */
  @OnEvent('item.updated', { async: true })
  async handleItemUpdated(event: ItemUpdatedEvent) {
    try {
      this.logger.log(
        `Checking downstream relationships to flag suspect for updated item ${event.itemId} (v${event.versionNumber})`,
      );
      const flaggedCount = await this.traceabilityService.triggerSuspectFlagForUpstreamChange(
        event.itemId,
        `Item updated to version ${event.versionNumber}`,
      );
      if (flaggedCount > 0) {
        this.logger.log(
          `Flagged ${flaggedCount} downstream relationship(s) as suspect for upstream item ${event.itemId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to trigger suspect flag for item ${event.itemId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
