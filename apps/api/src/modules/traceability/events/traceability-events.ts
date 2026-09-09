export class RelationshipCreatedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly projectId: string,
    public readonly upstreamItemId: string,
    public readonly downstreamItemId: string,
    public readonly userId: string,
  ) {}
}

export class RelationshipDeletedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly projectId: string,
    public readonly upstreamItemId: string,
    public readonly downstreamItemId: string,
    public readonly userId: string,
  ) {}
}

export class SuspectFlaggedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly downstreamItemId: string,
    public readonly upstreamItemId: string,
    public readonly reason: string,
  ) {}
}

export class SuspectClearedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly downstreamItemId: string,
    public readonly userId: string,
  ) {}
}
