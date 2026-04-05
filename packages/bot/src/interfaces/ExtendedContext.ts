import { Context } from "telegraf";
import { UserSession } from "./UserSession";

export interface ExtendedContext extends Context {
    session: UserSession;
}

export type ActionFunction = (ctx: ExtendedContext, userId?: number) => Promise<void>;
