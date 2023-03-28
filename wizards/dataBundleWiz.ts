import { Scenes, Markup } from "telegraf"
import { MyContext, DataBundles, transactionRef, PurchaseTranPayload } from "../types"
import axios, { AxiosResponse } from "axios"
import { bundleOptionKeyboard, isFourDigit, isTenDigit, transConfirmRes, transSuccessRes} from "../functions"
import { callbackQuery, message } from "telegraf/filters"
import { getRequest, getToken, postRequest } from "../networkFunctions"

export const DataBundleWizard = new Scenes.WizardScene<MyContext>(
  "buy-data",
  async (ctx) => {
    ctx.scene.session.telegramUserId = `${ctx.message?.from.id}`
    let token = await getToken()
    const response : AxiosResponse<any,any> = await getRequest(`${process.env.DATA_BUNDLES_API}`, token)
    
    if(response.status === 200){
      const databundles: DataBundles[] = response?.data

        ctx.scene.session.databundles = databundles

        await ctx.reply(
          "Select Data Bundle: ",
          Markup.inlineKeyboard(bundleOptionKeyboard(databundles))
        )
        return ctx.wizard.next()
    }
    else{
      await ctx.reply("Service is Unavailable. Enter /menu to go the main menu")
      return ctx.scene.leave()
    }

  },
  async (ctx) => {
    if (ctx.has(callbackQuery("data"))) {
      let index = parseInt(ctx.callbackQuery.data)
      ctx.scene.session.databundle_index = index
    }
    await ctx.reply(`Enter receipient's phone number:`)
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (ctx.has(message("text"))) {
      if(isTenDigit(ctx.message.text)){
        ctx.scene.session.receipientPhoneNumber = ctx.message.text
        
        await ctx.reply("Enter your PIN:")
        return ctx.wizard.next()
      }
      else{
        ctx.reply("Please enter a valid phone number:")
      }     
    }   
  },
  async (ctx) => {
    let pin = "";
    if (ctx.has(message("text"))) {
      pin = ctx.message.text
      ctx.deleteMessage(ctx.message.message_id)
    }
    if (isFourDigit(pin)) {
      let token = await getToken()
      await axios
        .post(`${process.env.CHECK_PIN_NUMBER}`, {
          telegramUserId: ctx.scene.session.telegramUserId,
          pinNumber: pin,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
             Accept: "*/*"
          },
          })
        .then((res) => {
          const isMatches: boolean = res.data;
          if (isMatches === true) {
            transConfirmRes(ctx)
          } else {
            ctx.reply("You entered a wrong PIN. Try again")
          }
        })
        .catch((e) => {
          //console.log(e, "error")
           ctx.reply("Failed. Service is Unavailable. Enter /menu to go the main menu")
          return ctx.scene.leave()
        });
    } else {
      ctx.reply("Please enter a valid 4 digit PIN:") 
    }
  },
  async (ctx) => {
    let index = ctx.scene.session.databundle_index
    if (ctx.has(message("text"))) {
      if(ctx.message.text === 'Buy'){
        const token = await getToken()
        const payload: PurchaseTranPayload  = {
          telegramUserId: ctx.scene.session.telegramUserId,
          receipientPhoneNumber: "233" + ctx.scene.session.receipientPhoneNumber.substring(1),
          bundleId: ctx.scene.session.databundles[index].bundleId,
        }
        let response : AxiosResponse<any,any> = await postRequest(`${process.env.DATA_PURCHASE_API}`, payload, token)
        if(response.status === 200) {
             const transRef: transactionRef = response?.data
              await transSuccessRes(ctx, transRef)
        }
        else {
          await ctx.reply('Failed. Service is Unavailable. Enter /menu to go the main menu')
          return ctx.scene.leave()
        }
      }
      if(ctx.message.text === 'Cancel'){
        ctx.reply('Data bundle purchase cancelled')
        ctx.reply('Enter /menu to go to the main menu')
        return ctx.scene.leave()
      }
    }
  }
);
