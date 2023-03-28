import dotenv from "dotenv";
import { Scenes, session, Telegraf, Markup } from "telegraf";
import TelegrafLogger from "telegraf-logger";
import { CheckCustomerPayload, MyContext } from "./types";
import { CalculatorWizard } from "./wizards/calculatorWiz";
import { DataBundleWizard } from "./wizards/dataBundleWiz";
import { onBoardingWizard } from "./wizards/onboardingWiz";
import { menuKeyboard, consoleLogFile } from "./functions";
import {  getToken, postRequest } from "./networkFunctions";

dotenv.config();

const bot = new Telegraf<MyContext>(`${process.env.BOT_TOKEN}`);

const logger = new TelegrafLogger({
  log: consoleLogFile.log,
  format:
    "Update type => %ut | Time => " +
    new Date().toLocaleString() +
    " | From => @%u %fn %ln | Sender ID => (%fi) | Payload => <%ust> %c",
  contentLength: 500,
})

const stage = new Scenes.Stage<MyContext>([CalculatorWizard, DataBundleWizard, onBoardingWizard])

bot.use(logger.middleware())
bot.use(session());
bot.use(stage.middleware())

bot.start(async(ctx) => {
  let token = await getToken()
  const payload: CheckCustomerPayload = {
    telegramUserId: "412312363"
    //telegramUserId: ctx.from.id,
  }
  
  let response = await postRequest(`${process.env.CHECK_CUSTOMER_API}`, payload, token)
  const { data } = response
  const isExists : boolean = data
  if (isExists) {
    ctx.reply(`Welcome, ${ctx.message?.from.first_name}! 
Choose an option:`, menuKeyboard)
  } else {
     ctx.reply(
    `Welcome to C-Bot, ${ctx.message?.from.first_name}! This is your first here. Kindly tap 'Register' to register your account`,
    Markup.keyboard([[{ text: "Register", request_contact: true }]]).resize().oneTime()
  )
  }
})


bot.command("menu", async (ctx) => {
  let token = await getToken()
  const payload: CheckCustomerPayload = {
    telegramUserId: "412312363"
    //telegramUserId: ctx.from.id,
  }
  let response = await postRequest(`${process.env.CHECK_CUSTOMER_API}`, payload, token)
  const {data} = response
  const isExists : boolean = data
  if (isExists) {
    ctx.reply(`Choose an option:`, menuKeyboard)
  } else {
     ctx.reply(
    `Welcome to C-Bot, ${ctx.message?.from.first_name}! Kindly tap 'Register' to register your account`,
    Markup.keyboard([[{ text: "Register", request_contact: true }]]).resize().oneTime()
  )
  }
})


bot.on("contact", async (ctx) =>  ctx.scene.enter("on-boarding"))


bot.hears("Calculator", (ctx) => ctx.scene.enter("calculator"))
bot.hears("Buy Data", (ctx) => ctx.scene.enter("buy-data"))


bot.on("message", (ctx) => ctx.reply("Enter /start to start the bot"))
bot.launch()
