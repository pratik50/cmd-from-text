#!/usr/bin/env node
import dotenv from "dotenv";
import chalk from "chalk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import shell from "shelljs";
import inquirer from "inquirer";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getCommandFromAiGPT(userInput) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Only provide the Linux shell command for: "${userInput}`;
    const result = await model.generateContent(prompt);

    if (
      result.response.candidates[0].content.parts[0]
    ) {
      const commandText = result.response.candidates[0].content.parts[0].text;

      const cleanCommand = commandText
        .replace(/```bash|```/g, "") // Remove markdown-style code blocks
        .trim();

      return cleanCommand;
    } else {
      console.error(chalk.bold.red("Command not found."));
    }

    return null; // Return null if no command is found
  } catch (error) {
    console.error(chalk.bold.red("Error communicating with Intelligence:", error.message));
    return null; 
  }
}

async function runCLI() {
  console.log()
  const { userInput } = await inquirer.prompt([
    {
      type: "input",
      name: "userInput",
      message: "What command you wants to execute? ",
    },
  ]);

  console.log("\nSearching...");

  const command = await getCommandFromAiGPT(userInput);

  if (command) {

    let fileOrFolderName;

    if(command.includes("filename") || command.includes("<file_name")){

      const { fileOrFolderName: file_name } = await inquirer.prompt([
        {
          type: "input",
          name: "fileOrFolderName",
          message: chalk.blueBright("Provide the name of your file: "),
        }
      ]);
      fileOrFolderName = file_name
    }else if (command.includes("<folder_name>") || command.includes("folder_name")){
      const { fileOrFolderName: folderName } = await inquirer.prompt([
        {
          type: "input",
          name: "fileOrFolderName",
          message: chalk.blueBright("Provide the name of your folder: "),
        },
      ]);
      fileOrFolderName = folderName
    }
      
    const Command = command
      .replace("<folder_name>", fileOrFolderName)
      .replace("<file_name>", fileOrFolderName)
      .replace("folder_name", fileOrFolderName)
      .replace("file_name", fileOrFolderName)
      .replace("filename", fileOrFolderName)
      .replace("fileName", fileOrFolderName);

    console.log(`\nExpected Command : ${chalk.green(Command)}\n`);

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Do you want to run this command? ",
      },
    ]);

    if (confirm) {
      // Run the command using shelljs
      shell.exec(Command);
      console.log(chalk.bold.green("Command successfully execute"));
    } else {
      console.log(chalk.red("Command execution cancelled."));
    }
  } else {
    console.log(chalk.bold.red("\nSorry, I couldn't understand what you want to perform."));
  }
}

// Run the CLI
runCLI();
