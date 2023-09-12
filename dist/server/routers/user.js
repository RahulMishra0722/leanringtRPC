"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const userInputType = zod_1.z.object({
    username: zod_1.z.string(),
    email: zod_1.z.string(),
    password: zod_1.z.string()
});
const todoInputType = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string()
});
const jwtSecret = process.env.JWT_SECRET;
const userRouter = (0, trpc_1.router)({
    SignUp: trpc_1.publicProcedure
        .input(userInputType)
        .mutation((opts) => __awaiter(void 0, void 0, void 0, function* () {
        const username = opts.input.username;
        const email = opts.input.email;
        const password = opts.input.password;
        const existingUser = yield db_1.User.findOne({ email: email });
        if (existingUser) {
            return {
                error: 'User with this email already exists',
            };
        }
        else {
            const newUser = new db_1.User({
                username: username,
                email: email,
                password: password,
            });
            try {
                const savedUser = yield newUser.save();
                const userId = savedUser._id.toString();
                if (!jwtSecret) {
                    return;
                }
                const token = jsonwebtoken_1.default.sign({ userId: userId }, jwtSecret, { expiresIn: '1h' });
                return {
                    token
                };
            }
            catch (error) {
                return {
                    error: 'An error occurred while creating the user',
                };
            }
        }
    })),
});
