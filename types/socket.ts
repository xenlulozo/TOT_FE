export type PlayerInfo = {
    id: string;
    data?: {
        name?: string;
        [key: string]: unknown;
    };
    isHost: boolean;
    status?: string;
    avatar: string;

};
export enum RoundState {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED"
  }
export type IPlayerInfo = {
    id: string;
    name: string;
    avatar: string;
    roundState: RoundState;
    isHost: boolean;
};
export type IRoomStatePayload = {
    players: IPlayerInfo[];
    meta: Record<string, unknown>;
    hostId: string;
};
export type RoomStatePayload = {
    players: PlayerInfo[];
    meta: Record<string, unknown>;
    hostId: string;
};

export type TotPromptType = "truth" | "trick";

export type PromptOption = {
    id: string;
    content: string;
    type: TotPromptType;
};

export type PromptOptions = {
    truth?: PromptOption;
    trick?: PromptOption;
    [key: string]: PromptOption | undefined;
};

export type TotTurnOptionSelectedPayload = {
    type: TotPromptType;
    content: string;
};

export type PlayerRenamedPayload = {
    playerId: string;
    name: string;
};

export type PlayerAvatarUpdatedPayload = {
    playerId: string;
    avatar: string;
};

export type PlayerSelectedPayload = {
    player: PlayerInfo & {
        name?: string;
    };
    remainingCount: number;
    totalPlayers: number;
    exhausted: boolean;
    source?: string;
    promptOptions?: PromptOptions;
    nextAutoSelectionInMs?: number | null;
};

export const isRoomStatePayload = (payload: unknown): payload is RoomStatePayload => {
    if (typeof payload !== "object" || payload === null) {
        return false;
    }

    const record = payload as Record<string, unknown>;
    if (!Array.isArray(record.players) || typeof record.hostId !== "string") {
        return false;
    }

    return record.players.every((player) => {
        if (typeof player !== "object" || player === null) {
            return false;
        }

        const playerRecord = player as Record<string, unknown>;
        return (
            typeof playerRecord.id === "string" &&
            typeof playerRecord.isHost === "boolean"
        );
    });
};

export const isPlayerSelectedPayload = (payload: unknown): payload is PlayerSelectedPayload => {
    if (typeof payload !== "object" || payload === null) {
        return false;
    }

    const record = payload as Record<string, unknown>;

    if (typeof record.remainingCount !== "number" || typeof record.totalPlayers !== "number") {
        return false;
    }

    if (typeof record.exhausted !== "boolean" || typeof record.player !== "object" || record.player === null) {
        return false;
    }

    const { player, promptOptions } = record as {
        player: Record<string, unknown>;
        promptOptions?: Record<string, unknown>;
    };

    const basicPlayerCheck = typeof player.id === "string" && typeof player.isHost === "boolean";
    if (!basicPlayerCheck) {
        return false;
    }

    if (promptOptions) {
        const optionValues = Object.values(promptOptions);
        return optionValues.every((option) => {
            if (typeof option !== "object" || option === null) {
                return false;
            }

            const optionRecord = option as Record<string, unknown>;
            return (
                typeof optionRecord.id === "string" &&
                typeof optionRecord.content === "string" &&
                (optionRecord.type === "truth" || optionRecord.type === "trick")
            );
        });
    }

    return true;
};

export const isTotTurnOptionSelectedPayload = (payload: unknown): payload is TotTurnOptionSelectedPayload => {
    if (typeof payload !== "object" || payload === null) {
        return false;
    }

    const record = payload as Record<string, unknown>;
    if (record.type !== "truth" && record.type !== "trick") {
        return false;
    }

    return typeof record.content === "string" && record.content.length > 0;
};

export const isPlayerRenamedPayload = (payload: unknown): payload is PlayerRenamedPayload => {
    if (typeof payload !== "object" || payload === null) {
        return false;
    }

    const record = payload as Record<string, unknown>;

    return typeof record.playerId === "string" && typeof record.name === "string" && record.name.length > 0;
};

export const isPlayerAvatarUpdatedPayload = (payload: unknown): payload is PlayerAvatarUpdatedPayload => {
    if (typeof payload !== "object" || payload === null) {
        return false;
    }

    const record = payload as Record<string, unknown>;

    return typeof record.playerId === "string" && typeof record.avatar === "string" && record.avatar.length > 0;
};


