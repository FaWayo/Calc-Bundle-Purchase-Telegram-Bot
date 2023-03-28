import { Scenes, Markup } from 'telegraf'
import { message } from "telegraf/filters"
import {MyContext} from "../types"
import { isInt, performOperation } from "../functions"

export const CalculatorWizard = new Scenes.WizardScene<MyContext>(
    'calculator',
    async (ctx) => {
            await ctx.reply(`Choose the operation you would like to perform: `, Markup.keyboard([
                [{ text: "Add" }],
                [{ text: "Subtract" }],
                [{ text: "Divide" }],
                [{ text: "Multiply" }],
             ]).oneTime())
            return ctx.wizard.next()
    },
    async (ctx) => {
        if (ctx.has(message("text"))) {
            ctx.scene.session.operation = ctx.message.text
          }
          await ctx.reply("Enter the first number:")
          return ctx.wizard.next()
    },
    async (ctx) => {
        if (ctx.has(message("text"))) {
          ctx.scene.session.input1 = parseInt(ctx.message.text)
            if (isInt(ctx.message.text)) {
              await ctx.reply("Enter the second number:")
              return ctx.wizard.next()
            } else {
              ctx.reply("Please enter a valid digit:")
              return
            }
          } 
    },
    async (ctx) => {
        if (ctx.has(message("text"))) {
            if (isInt(ctx.message.text)) {
              ctx.scene.session.input2 = parseInt(ctx.message.text)
      
              const sessionInfo = ctx.scene.session
              const { operation, input1, input2 } = sessionInfo
      
              const result = performOperation(operation, input1, input2)
              console.log(ctx.scene.session)
      
              await ctx.reply(`The answer is: ${result}`)
              await ctx.reply(`Enter /menu to go to the main menu`)
              return ctx.scene.leave()
            } else {
              ctx.reply("Please enter a valid digit and try again")
            }
          }
    }
)

