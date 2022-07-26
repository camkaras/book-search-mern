const { User } = require("../models");
const { signToken } = require("../utils/auth");
const { AuthenticationError } = require("apollo-server-express");

const resolvers = {
	Query: {
		me: async (parent, args, context) => {
			if (context.user) {
				const userData = User.findOne({ _id: context.user._id }).select("-__v -password");
				return userData;
			}
			throw new AuthenticationError("You need to be logged in!");
		},
	},

	Mutation: {
		addUser: async (parent, args) => {
			const user = await User.create(args);
			const token = signToken(user);
			return { token, user };
		},
        login: async (parent, { email, password }, context) => {
			const user = await User.findOne({ email });
			if (!user) {
				throw new AuthenticationError("Incorrect email or password");
			}
			const isValid = await user.isCorrectPassword(password);
			if (!isValid) {
				throw new AuthenticationError("Incorrect username or password");
			}
			const token = signToken(user);
			return { token, user };
		},

		saveBook: async (parent, { bookData }, context) => {
			if (context.user) {
				const updatedUser = await User.findByIdAndUpdate(
					{ _id: context.user._id },
					{ $push: { savedBooks: bookData } },
					{ new: true }
				);
				return updatedUser;
			}
		},

		removeBook: async (parent, { bookId }, context) => {
			if (context.user) {
				const currentUser = await User.findOneAndUpdate(
					{ _id: context.user._id },
					{ $pull: { savedBooks: { bookId } } },
					{ new: true }
				);
			return currentUser;
			}
            throw new AuthenticationError('You need to be logged in!');
		},
	},
};

module.exports = resolvers;