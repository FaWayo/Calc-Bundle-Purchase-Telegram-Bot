import { Markup, Scenes } from "telegraf"
import { AddCustomerPayload, MyContext, sendOTPPayload, verifyOTPPayload } from "../types"
import {message } from "telegraf/filters"
import { isFourDigit,isSixDigit,isValidDate} from "../functions"
import {getToken, postRequest} from "../networkFunctions"
import { AxiosResponse } from "axios"

export const onBoardingWizard = new Scenes.WizardScene<MyContext>(
  "on-boarding",
  async (ctx) => {
    if (ctx.has(message("contact"))) {
      ctx.scene.session.phoneNumber = ctx.message.contact.phone_number;
    }
    await ctx.reply("Enter your first name")
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (ctx.has(message("text"))) {
      ctx.scene.session.firstName = ctx.message.text;
    }
    await ctx.reply("Enter your last name")
    // , Markup.keyboard([
    //   [
    //     { text: "Back"},
    //   ],
    // ]).resize().oneTime()
    return ctx.wizard.next()
  },
  async (ctx) => {  
    if (ctx.has(message("text"))) {
      ctx.scene.session.lastName = ctx.message.text;
    }
    await ctx.reply(`Enter your date of birth
in the format 'yyyy-mm-dd'`);
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.has(message("text"))) {
      let dateofBirth = ctx.message.text;
      if (isValidDate(dateofBirth)) {
        ctx.scene.session.dateOfBirth = dateofBirth;
        await ctx.reply(
          "Select your gender",
          Markup.keyboard([
            [
              { text: "Male"},
              { text: "Female"},
            ],
          ]).resize().oneTime()
        );
        return ctx.wizard.next()
      } else {
        await ctx.reply(
          `Enter your date of birth in the valid format 'yyyy-mm-dd'`
        );
        return;
      }
    }
  },
  async (ctx) => {
    if (ctx.has(message("text"))) {
      let gender = ctx.message.text;
      ctx.scene.session.gender = gender;
    }
    await ctx.reply("Choose a 4-digit PIN");
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.has(message("text"))) {
      let pinNumber = ctx.message.text;
      ctx.deleteMessage(ctx.message.message_id)
      if (isFourDigit(pinNumber)) {
        ctx.scene.session.pinNumber = pinNumber
        await ctx.reply("Confirm PIN")
        return ctx.wizard.next()
      } else {
        await ctx.reply("Please enter a 4-digit pin")
        return;
      }
    }
  },
  async (ctx) => {
    if (ctx.has(message("text"))) {
      if (ctx.message.text === ctx.scene.session.pinNumber) {
        ctx.deleteMessage(ctx.message.message_id)
        await ctx.reply(
          `Your account details are: 

First Name: ${ctx.scene.session.firstName}
Last Name: ${ctx.scene.session.lastName}
Username: ${ctx.message.from.username}
Phone Number: ${ctx.scene.session.phoneNumber}
Date of Birth: ${ctx.scene.session.dateOfBirth}
Gender: ${ctx.scene.session.gender}`,
          Markup.keyboard([
            [{ text: "Confirm" }],
            [{ text: "Restart registration" }],
          ]).resize().oneTime()
        )
        return ctx.wizard.next()
      } else {
        await ctx.reply(`PIN number must match.`, Markup.keyboard([{text: 'Enter a different PIN'}]).resize().oneTime())
        return ctx.wizard.selectStep(5);
      }
    }
  },
  async (ctx) => {
   
    if (ctx.has(message("text"))) {
      if(ctx.message.text === "Home"){
       await ctx.reply('Are you sure?', Markup.keyboard([{text: 'Yes'}]).resize().oneTime())
       return ctx.scene.leave()
      }
      if (ctx.message.text === "Confirm" || ctx.message.text === "Resend OTP") 
      {
        const token = await getToken()
        const payload: sendOTPPayload = {
          phoneNumber: ctx.scene.session.phoneNumber,
        }
        const response:  AxiosResponse<any, any> = await postRequest(`${process.env.SEND_OTP}`, payload, token)
        if(response.status === 200){
          await ctx.reply(
            `An OTP Code has been sent to your number ${ctx.scene.session.phoneNumber}. Please enter the 6-digit code `
          )
          return ctx.wizard.next()
        }
        else {
          await ctx.reply("Service is Unavailable. Enter /menu to go the main menu")
          return ctx.scene.leave()
        }
      } 
      if(ctx.message.text === "Restart registration"){
        ctx.reply('Are you sure you want to restart?', Markup.keyboard([{text: 'Yes'}]).resize().oneTime())
        return ctx.wizard.selectStep(0)
      }
    }
  },
  async (ctx) => {
    if (ctx.has(message("text"))) {
      if (isSixDigit(ctx.message.text)) {
        let otpCode = ctx.message.text
        const token = await getToken()
        const verifyOTPPayload: verifyOTPPayload = {
          otpCode: otpCode,
        }
        const response : AxiosResponse<any,any> = await postRequest(`${process.env.VERIFY_OTP}`,verifyOTPPayload, token)
        if (response.status === 200) {
          const customerPayload: AddCustomerPayload = {
            firstName: ctx.scene.session.firstName,
            lastName: ctx.scene.session.lastName,
            phoneNumber: ctx.scene.session.phoneNumber,
            //telegramUserId: `${ctx.message?.from.id}`
            telegramUserId: "412312363",
            pinNumber: ctx.scene.session.pinNumber,
            userName: ctx.message.from.username,
            dateOfBirth: ctx.scene.session.dateOfBirth,
            gender: ctx.scene.session.gender
          }
          const addCustomerResponse : AxiosResponse<any,any> = await postRequest(`${process.env.ADD_CUSTOMER}`, customerPayload, token)
          if(addCustomerResponse.status === 200){
            await ctx.reply(
              "Congratulations, your account has been added successfully"
            )
            await ctx.reply(`Enter /menu to go to the main menu`)
            return ctx.scene.leave()
          }
          else{
            await ctx.reply("Failed. Service is Unavailable. Enter /menu to go the main menu")
            return ctx.scene.leave()
          }          
        } else {
          await ctx.reply(
            "OTP code did not match",
            Markup.keyboard([
              [{ text: "Resend OTP" }],
              [{ text: "Home" }],
            ]).resize()
          );
          return ctx.wizard.selectStep(7);
        }
      } else {
        await ctx.reply("Enter a valid 6-digit OTP code");
      }
    }
  }
);
