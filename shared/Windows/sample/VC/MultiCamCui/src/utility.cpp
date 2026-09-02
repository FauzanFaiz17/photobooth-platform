#include <map>
#include <iostream>
#include <iterator>
#include <regex>
#include <string>
#include "EDSDKTypes.h"
#include "utility.h"

void clr_screen()
{
	std::cout << "\033[2J";	  // screen clr
	std::cout << "\033[0;0H"; // move low=0, column=0
}

EdsUInt32 gethex()
{
	std::string input;
	std::smatch match_results;
	std::getline(std::cin, input); // Pass if only return key is input.
	if (input != "\n")
	{
		if (std::regex_search(input, match_results, std::regex("[a-fA-F0-9]")))
		{
			//input = "f";
			EdsUInt32 ret;
			ret = stoul((input), 0, 16);
			return ret;
		}
	}
	return (-1);
}

EdsInt32 getvalue()
{
	std::string input;
	std::smatch match_results;
	std::getline(std::cin, input); // Pass if only return key is input.
	if (input != "\n")
	{
		if (std::regex_search(input, match_results, std::regex("[0-9]")))
		{
			return (stoi(input));
		}
	}
	return (-1);
}

EdsInt32 getIntValue()
{
	std::string input;
	std::smatch match_results;
	std::getline(std::cin, input); // Pass if only return key is input.
	if (input != "\n")
	{
		if (std::regex_search(input, match_results, std::regex("[0-9-]")))
		{
			return (stoi(input));
		}
		else
		{
			std::cout << "Error invalid parameter" << std::endl;
			return (0xff);
		}
	}
	return (0xff);
}

EdsInt32 getstrings(std::string& cstr, EdsInt32 number)
{
	// number is assumed to be the buffer size (including the null terminator)
	if (number <= 1) return -1; // There is not enough characters to store
	std::string input;
	if (!std::getline(std::cin, input)) {
		// Read failure (EOF, etc.)
		return -1;
	}

	if (input.empty()) {
		// Treat only Enter (blank line) as an error
		return -1;
	}

	// Stores up to number-1 characters (off-by-one correction)
	std::size_t maxChars = static_cast<std::size_t>(number - 1);
	if (input.size() > maxChars) {
		cstr = input.substr(0, maxChars);
	}
	else {
		cstr = input;
	}

	// An example where only printable ASCII characters (0x20-0x7E) and spaces are allowed
	// Check if the entire input is within this range
	static const std::regex re("^[\\x20-\\x7E]+$");
	if (std::regex_match(cstr, re)) {
		return 1; 
	}
	else {
		std::cout << "Error invalid character" << std::endl;
		return -1;
	}
}

void pause_return()
{
	//	system("pause");
	std::cout << "\n"
		<< "Press the RETURN key." << std::endl;
	getvalue();
}

void ListAvailValue(std::map<EdsUInt32, const char*> _table)
{
	std::cout << "available settings are...\n";
	for (auto iter = _table.begin(); iter != _table.end(); ++iter)
	{
		std::cout << iter->first << ":" << iter->second << "\n";
	}
}