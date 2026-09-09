export class ItemCreatedEvent {
  constructor(
    public readonly itemId: string,
    public readonly projectId: string,
    public readonly actorId: string,
    public readonly itemKey: string,
  ) {}
}

export class ItemUpdatedEvent {
  constructor(
    public readonly itemId: string,
    public readonly projectId: string,
    public readonly actorId: string,
    public readonly versionNumber: number,
  ) {}
}

export class ItemLockedEvent {
  constructor(
    public readonly itemId: string,
    public readonly actorId: string,
  ) {}
}

export class ItemUnlockedEvent {
  constructor(
    public readonly itemId: string,
    public readonly actorId: string,
  ) {}
}

export class ItemSubscribedEvent {
  constructor(
    public readonly itemId: string,
    public readonly userId: string,
    public readonly isSubscribed: boolean,
  ) {}
}
