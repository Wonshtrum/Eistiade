#include <iostream>

int main() {
	int num;
	std::cin >> num;
	std::cin.ignore();
	std::cerr << "I'm " << num << " apparently" << std::endl;
	while (true) {
		std::string line;
		for (int i = 0 ; i<6 ; i++) {
			getline(std::cin, line);
			//std::cerr << "> " << line << std::endl;
		}
		//std::cerr << std::endl;
		std::cout << 0 << std::endl;
	}
	return 0;
}
