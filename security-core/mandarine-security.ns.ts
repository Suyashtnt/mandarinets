// Copyright 2020-2020 The Mandarine.TS Framework authors. All rights reserved. MIT license.

import type { Cookie } from "../mvc-framework/core/interfaces/http/cookie.ts";
import { Mandarine } from "../main-core/Mandarine.ns.ts";
import type { Request, Response } from "../deps.ts"

/**
 * Contains all the essentials for Mandarine's security core to work
 */
export namespace MandarineSecurity {

    export namespace Crypto {
        export interface PasswordEncoder {
            encode: (rawPassword: string) => string;
            matches: (rawPassword: string, encodedPassword: string) => boolean;
        }
    }

    export namespace Sessions {

        /**
        * Used in callbacks from Mandarine's native Session storage system. This is not necessary to use.
        *
        */
        export enum MandarineSessionExceptions {
            SESSION_NOT_FOUND = 0
        }

        /**
         * Represents the object of a mandarine session. **This is not customizable**.
         *
         */
        export interface MandarineSession {
            sessionID: string;
            sessionCookie: Cookie | undefined;
            sessionData?: object;
            expiresAt?: Date;
            createdAt?: Date;
            isSessionNew?: boolean;
        }

        /**
         * Represents how a SessionStore implementation should be designed.
         * SessionStore is used to design & use the process of manipulating sessions
         *
         */

        export interface SessionStore {
            options: {
                expirationInterval: any,
                autoclearExpiredSessions: boolean
            }

            /**
             * Initialize intervals and creates an object in `windows` or any other context where the sessions will be stored
             */
            launch(): void;

            /**
             * Gets a session. If it does not exist returns undefined. If param config.touch = true, updates the expiration of the session
             */
            get(sessionID: string, config?: { touch: boolean }): Mandarine.Security.Sessions.MandarineSession | undefined,

            /**
             * Gets all the sessions in the session container
             */
            getAll(): Array<Mandarine.Security.Sessions.MandarineSession>,

            /**
             * Adds a session to the session container.
             * For overriding, set config.override to true
             */
            set(sessionID: string, session: Mandarine.Security.Sessions.MandarineSession, config?: { override: boolean }): Mandarine.Security.Sessions.MandarineSession;
            /**
             * Removes a session from the session container if it exists
             */
            destroy(sessionID: string): void;
            /**
             * Updates the expiration of a session
             */
            touch(sessionID: string): Mandarine.Security.Sessions.MandarineSession | undefined;
            /**
             * Verifies whether a session exists
             */
            exists(sessionID: string): boolean;

            /**
             * Clears all those sessions that have expired in the session container
             */
            clearExpiredSessions(): void;
            /**
             * Starts the interval that control the automatic cleaning of session expiration
             */
            startExpiringSessions(): void;
            /**
             * Removes the intervals set in the container
             */
            stopIntervals(): void;

            /**
             * Gets the current `setInterval` in the session container for expired sessions
             */
            getExpirationInterval(): void;
            /**
             * Sets a new handler for expired sessions
             */
            setExpirationInterval(intervalHandler: any): void;

            /**
             * Expiration time of a session (IN MS)
             * Default: (1000 * 60 * 60 * 24) (1 day)
             */
            getDefaultExpiration(): number;
        }
        

        export interface SessionCookie {
            path?: string,
            httpOnly?: boolean
            secure?: boolean,
            maxAge?: number | null
        }

        /**
         * Represents the object of the configuration for the Session Container
         *
         */
        export interface SessionContainer {
            cookie?: SessionCookie,
            keys: string[],
            sessionPrefix?: string;
            genId?: Function,
            resave?: boolean,
            rolling?: boolean,
            saveUninitialized?: boolean,
            store?: SessionStore
        }

        /**
         * Data present in request regarding the current session
         */
        export interface SessionContextObj {
            sessionID: string;
            sessionCookie: any;
            sessionData: any;
        }
  
    }

    export namespace Auth {

        /**
         * Permission validators are functions executed during the evaluation of a security expression.
         * PermissionValidator is how Mandarine interprets a security expression
         */
        export type PermissionValidator = (request: any, authentication: any) => (...parameters: Array<any>) => boolean;

        export type GrantedAuthority = string;
        export type PredefinedExpressions = "isauthenticated()" | "hasRole()";
        export type Permissions = Array<string | Mandarine.Security.Auth.GrantedAuthority | Mandarine.Security.Auth.PredefinedExpressions> | string;

        /**
         * List of known authentication exceptions
         */
        export enum AuthExceptions {
            INVALID_USER = "INVALID_USER",
            INVALID_PASSWORD = "INVALID_PASSWORD",
            INVALID_ROLES = "INVALID_ROLES",
            ACCOUNT_EXPIRED = "ACCOUNT_EXPIRED",
            ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
            CREDENTIALS_EXPIRED = "CREDENTIALS_EXPIRED",
            ACCOUNT_DISABLED = "ACCOUNT_DISABLED",
            INVALID_COOKIE = "INVALID_COOKIE",
        }
        
        /**
         * Interface for the minimum of information a user model must have when using Mandarine's built-in authentication.
         */
        export interface UserDetails {
            /**
             * Returns an array with the roles the current user has. Cannot return null nor undefined inside the array.
             * Ex: ["ADMIN", "MODERATOR", "USER"]
             */
            roles: Array<GrantedAuthority> | Array<string>;

            /**
             * Returns the password (encrypted) of the current user.
             */
            password: string;

            /**
             * Returns the username of the current user
             */
            username: string;

            /**
             * Returns the id of the current user
             */
            uid: number | string;

            /**
             * Indicates whether the user's account has expired. 
             * An expired account cannot be authenticated.
             */
            accountExpired: boolean;

            /**
             *  Indicates whether the user is locked or unlocked.
             *  A locked user cannot be authenticated.
             */
            accountLocked: boolean;
            /**
             * Indicates whether the user's credentials (password) has expired. 
             * An account with expired credentials cannot be authenticated.
             */
            credentialsExpired: boolean;

            /**
             * Indicates whether the user is enabled or disabled. 
             * A disabled user cannot be authenticated.
             */
            enabled: boolean;
        }

        /**
         * Interface for a mandarine-powered component (type service) which will be used for built-in authentication
         */
        export interface UserDetailsService {
            /**
             * Locates the user based on the username.
             * 
             * @param username the username identifying the user whose data is required.
             * 
             * @returns A user record with an implementation of UserDetails
             * 
             * @throws MandarineSecurityException if no user was found.
             */
            loadUserByUsername: (username: string) => UserDetails | undefined;
        }

        /**
         * Contains the state of a built-in authentication process
         * 
         * @public status => Status of the built-in authentication process: FAILED if known error, PASSED if success, ALREADY-LOGGED-IN if success, UNKNOWN if unknown error
         * @public exception => Exception if known
         * authSesId => Current Session id of authentication if ALREADY-LOGGED-IN or login passed
         * message => data of the status
         */
        export interface AuthenticationResult {
            status: "FAILED" | "PASSED" | "ALREADY-LOGGED-IN" | "UNKNOWN";
            exception?: AuthExceptions; 
            authSesId?: string;
            message?: string;
        }

        /**
         * Principal interface for the authentication manager builder, which indicates what what service (implementing Mandarine.Security.Auth.UserDetailsService) we will call for built-in authentication
         */
        export interface AuthenticationManagerBuilder {
            userDetailsService: (implementation: any) => AuthenticationManagerBuilder;
            getUserDetailsService: () => UserDetailsService;
            passwordEncoder: (implementation: Crypto.PasswordEncoder) => AuthenticationManagerBuilder;
            getPasswordEncoder(): Crypto.PasswordEncoder;
        }

        /**
         * Private API to perform authentication (Mandarine's built-in Authentication)
         */
        export interface Authenticator {
            verifyAuthenticationSatisfaction: () => boolean;
            isAuthenticated: (requestContext: Mandarine.Types.RequestContext) => boolean;
            performAuthentication: (username: string, password: string, requestContext: Mandarine.Types.RequestContext) => AuthenticationResult;
            stopAuthentication: (requestContext: Mandarine.Types.RequestContext) => void;
        }

        /**
         * Handler for login/logout whether successful or not. This is executed after login/logout was called (from built-in authentication)
         */
        export interface Handler {
            onSuccess: (request: Request, response: Response, result: AuthenticationResult) => void;
            onFailure: (request: Request, response: Response, result: AuthenticationResult) => void;
        }

        /**
         * Data present in request.authentication
         * AUTH_SES_ID refers to the session id with the data of the user that was logged in through Mandarine's built-in authentication
         * AUTH_EXPIRES refers to the time when the session will expire
         * AUTH_PRINCIPAL refers to all the data that was loaded (following the UserDetails implementation)
         */
        export interface RequestAuthObj {
            AUTH_SES_ID: string;
            AUTH_EXPIRES: Date;
            AUTH_PRINCIPAL: any;
        }
    }

    export namespace Core {

        /**
         * Data to be used for login/logout purposes from built-in authentication
         */
        export interface LoginConfigurer {
            loginProcessingUrl: string | undefined;
            loginSucessUrl: string | undefined;
            usernameParameter: string | undefined;
            passwordParameter: string | undefined;
            logoutUrl: string | undefined;
            logoutSuccessUrl: string | undefined;
            handler: Auth.Handler;
        }

        export namespace Modules {
            /**
             * Implementation of Login Builder, used to create the behaviors for built-in authentication
             */
            export interface LoginBuilder {
                login: LoginConfigurer;
                loginProcessingUrl: (url: string) => LoginBuilder;
                loginSuccessUrl: (url: string) => LoginBuilder;
                loginUsernameParameter: (parameter: string) => LoginBuilder;
                loginPasswordParameter: (parameter: string) => LoginBuilder;
                logoutUrl: (url: string) => LoginBuilder;
                logoutSuccessUrl: (url: string) => LoginBuilder;
                handler?: (handler: Auth.Handler) => LoginBuilder;
            }
        }

    }

    /**
     * Gets the current login builder which contains the information of the endpoints for built-in logins
     * 
     * @Returns Mandarine.Security.Auth.AuthenticationManagerBuilder
     */
    export function getAuthManagerBuilder(): Auth.AuthenticationManagerBuilder {
        let mandarineGlobal: Mandarine.Global.MandarineGlobalInterface = Mandarine.Global.getMandarineGlobal();
        return mandarineGlobal.__SECURITY__.auth.authManagerBuilder;
    }
}