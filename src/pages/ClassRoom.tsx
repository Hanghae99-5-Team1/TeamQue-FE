import { ChangeEvent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import styled from 'styled-components';
import apis from '../api';
import Stream from '../components/classroom/Stream';
import { RootState } from '../store/configStore';

type stateType = 'connect' | 'disconnect' | 'correct' | 'incorrect' | 'away';

type studentType = {
	userId: number;
	name: string;
	state: stateType;
};

type chatType = {
	chatId: string;
	userId: number;
	userName: string;
	content: string;
	type: 'chat' | 'question';
	likes?: { userId: number }[];
	isResolved?: boolean;
};

let socket: Socket;

const ClassRoom = () => {
	const [classInfo, setClassInfo] = useState<{
		title: string;
		teacher: string;
	}>();
	const { classid } = useParams();
	const loadClassInfo = async () => {
		const response = await apis.loadClassInfo(classid as string);
		setClassInfo(response.data);
	};

	useEffect(() => {
		loadClassInfo();
	}, []);

	// 소켓로직 시작
	const params = useParams();
	const [input, setInput] = useState('');
	const [chatList, setChatList] = useState<chatType[]>([]);
	const [myState, setMyState] = useState<stateType>('connect');
	const [students, setStudents] = useState<studentType[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [check, setChecked] = useState({
		chatCheck: false,
		questionCheck: false,
	});
	const { chatCheck, questionCheck } = check;

	const [isQuestion, setIsQuestion] = useState(false);
	const user = useSelector((state: RootState) => state.user);

	// const myStateImage = {
	// 	connect: '/images/myConnect.png',
	// 	correct: '/images/myCorrect.png',
	// 	incorrect: '/images/myIncorrect.png',
	// 	away: '/images/myAway.png',
	// };

	const studentStateImage = {
		disconnect: '/images/disconnect.png',
		connect: '/images/connect.png',
		correct: '/images/correct.png',
		incorrect: '/images/incorrect.png',
		away: '/images/away.png',
	};

	// const SOCKETSERVER = 'ws://noobpro.shop';
	const SOCKETSERVER = 'ws://xpecter.shop';
	const classId = params.classid;

	const accessToken = sessionStorage.getItem('accessToken');

	const socketInitiate = async () => {
		socket = io(SOCKETSERVER);
		socket.emit('init', { userId: user.id, accessToken });
		socket.on('initOk', () => {
			socket.emit(
				'joinRoom',
				{ classId },
				({
					chatList,
					userList,
				}: {
					chatList: {
						userId: number;
						userName: string;
						content: string;
						isResolved: boolean;
						uuid: string;
						likes: { userId: number }[];
					}[];
					userList: { key: { userName: string; state: stateType } };
				}) => {
					setChatList(
						chatList.map(
							({ userId, userName, content, isResolved, uuid, likes }) => ({
								userId,
								userName,
								content,
								isResolved,
								chatId: uuid,
								type: 'question',
								likes,
							})
						)
					);
					setStudents(
						Object.entries(userList).map(([key, { userName, state }]) => ({
							userId: parseInt(key),
							name: userName,
							state: state,
						}))
					);
				}
			);
			setIsConnected(true);
		});

		socket.on('changeState', ({ userId, state }) => {
			setStudents((prev) =>
				prev.map((student: studentType) =>
					student.userId === userId ? { ...student, state } : student
				)
			);
		});

		socket.on('receiveResolved', ({ chatId }) => {
			setChatList((prev) =>
				prev.map((chat) =>
					chat.chatId === chatId
						? { ...chat, isResolved: !chat.isResolved }
						: chat
				)
			);
		});

		socket.on('receiveChat', (data: chatType) => {
			setChatList((prev) => [...prev, { ...data, type: 'chat' }]);
		});

		socket.on('receiveQuestion', (data: chatType) => {
			setChatList((prev) => [
				...prev,
				{
					...data,
					likes: [],
					type: 'question',
				},
			]);
		});

		socket.on('receiveLike', ({ chatId, userId }) => {
			setChatList((prev) =>
				prev.map((chat) =>
					chat.chatId === chatId && chat.likes
						? { ...chat, likes: [...chat.likes, userId] }
						: chat
				)
			);
		});

		socket.on('receiveDelete', ({ chatId }) => {
			console.log(chatId);
			setChatList((prev) => prev.filter((chat) => chat.chatId !== chatId));
		});
	};

	useEffect(() => {
		return () => {
			socket.disconnect();
			setIsConnected(false);
		};
	}, []);

	useEffect(() => {
		if (!isConnected) {
			socketInitiate();
		}
	}, [isConnected]);

	const changeMyState = (state: stateType) => {
		if (myState === state) {
			state = 'connect';
		}
		socket.emit('changeMyState', { classId, state }, () => {
			setMyState(state);
		});
	};

	const sendChat = () => {
		if (input) {
			if (isQuestion) {
				socket.emit(
					'sendQuestion',
					{ content: input, classId },
					({ chatId, content }: { chatId: string; content: string }) => {
						setChatList([
							...chatList,
							{
								chatId: chatId,
								userId: user.id,
								userName: user.name,
								content,
								type: 'question',
								likes: [],
								isResolved: false,
							},
						]);
					}
				);
				setInput('');
			} else {
				socket.emit(
					'sendChat',
					{ content: input, classId },
					({ chatId, content }: { chatId: string; content: string }) => {
						setChatList([
							...chatList,
							{
								chatId: chatId,
								userId: user.id,
								userName: user.name,
								content,
								type: 'chat',
							},
						]);
					}
				);
				setInput('');
			}
		}
	};

	const changeMessage = (e: ChangeEvent<HTMLInputElement>) => {
		setInput(e.target.value);
	};

	const onChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;
		setChecked({
			...check,
			[name]: checked,
		});
	};

	const toggleChatType = (e: ChangeEvent<HTMLInputElement>) => {
		const { checked } = e.target;
		setIsQuestion(checked);
	};

	const toggleResolve = (id: string) => {
		socket.emit('sendResolved', { chatId: id, classId }, () => {
			setChatList((prev) =>
				prev.map((chat) =>
					chat.chatId === id ? { ...chat, isResolved: !chat.isResolved } : chat
				)
			);
		});
	};

	const likeQuestion = (id: string) => {
		console.log(id, classId);
		socket.emit('sendLike', { chatId: id, classId }, () => {
			setChatList((prev) =>
				prev.map((chat) =>
					chat.likes && chat.chatId === id
						? { ...chat, likes: [...chat.likes, { userId: user.id }] }
						: chat
				)
			);
		});
	};

	const likeCancelQuestion = (id: string) => {
		socket.emit('sendLike', { chatId: id, classId }, () => {
			setChatList((prev) =>
				prev.map((chat) =>
					chat.likes && chat.chatId === id
						? {
								...chat,
								likes: chat.likes.filter((like) => like.userId !== user.id),
						  }
						: chat
				)
			);
		});
	};

	const deleteQuestion = (id: string) => {
		socket.emit('sendDelete', { chatId: id, classId }, () => {
			setChatList((prev) => prev.filter((chat) => chat.chatId !== id));
		});
	};

	// 소켓로직 끝

	return (
		<Container>
			<LeftBox>
				<ClassInfo>
					<ClassTitle>{classInfo?.title}</ClassTitle>
					<ClassTeacher>{classInfo?.teacher}</ClassTeacher>
				</ClassInfo>
				<Stream />
				<StateBox>
					<MyStateBox>
						<UpperBox>
							<MyName>{user.name}</MyName>
							<StateButtons>
								<StateButton
									onClick={() => changeMyState('correct')}
									src='/images/correctbutton.png'
								/>
								<Hr />
								<StateButton
									onClick={() => changeMyState('incorrect')}
									src='/images/incorrectbutton.png'
								/>
								<Hr />
								<StateButton
									onClick={() => changeMyState('away')}
									src='/images/awaybutton.png'
								/>
							</StateButtons>
						</UpperBox>
						<MyStateCharacter src={`/images/my${myState}.png`} />
					</MyStateBox>
					<StudentStateBox>
						{students.map((student: studentType) => {
							if (student.userId !== user.id) {
								return (
									<StudentBox key={student.userId}>
										<StudentName>{student.name}</StudentName>
										<StudentState src={`/images/${student.state}.png`} />
									</StudentBox>
								);
							}
						})}
					</StudentStateBox>
				</StateBox>
			</LeftBox>
			<div>
				<label>
					<input name='chatCheck' type='checkbox' onChange={onChange} />
					채팅
				</label>
				<label>
					<input name='questionCheck' type='checkbox' onChange={onChange} />
					질문
				</label>
				{chatList &&
					chatList.map(
						({
							chatId,
							userId,
							type,
							userName: name,
							content,
							isResolved,
							likes,
						}: chatType) => {
							if (type === 'chat' && !chatCheck) {
								return (
									<div key={chatId}>
										<div>{name}</div>
										<div>{content}</div>
									</div>
								);
							} else if (type === 'question' && !questionCheck) {
								return (
									<div key={chatId}>
										<div>{name === user.name && '내 질문'}</div>
										<div>{name}</div>
										<div>{content}</div>
										<div>{isResolved && '해결'}</div>
										{userId === user.id && (
											<>
												<button onClick={() => toggleResolve(chatId)}>
													해결
												</button>
												<button onClick={() => deleteQuestion(chatId)}>
													삭제
												</button>
											</>
										)}
										{likes?.findIndex((like) => like.userId === user.id) !==
										-1 ? (
											<button onClick={() => likeCancelQuestion(chatId)}>
												추천취소
											</button>
										) : (
											<button onClick={() => likeQuestion(chatId)}>추천</button>
										)}
										<div>{likes?.length}</div>
									</div>
								);
							}
						}
					)}
				<div>
					<input
						type='text'
						value={input}
						onChange={changeMessage}
						onKeyPress={(e) => {
							if (e.key === 'Enter') {
								sendChat();
							}
						}}
					/>
					<button onClick={sendChat}>전송</button>
					<label>
						질문
						<input type='checkbox' name='queCheck' onChange={toggleChatType} />
					</label>
				</div>
			</div>
		</Container>
	);
};

export default ClassRoom;

const Container = styled.div`
	width: 1200px;
	height: 850px;
	margin: 40px auto 0;
	display: flex;
	justify-content: space-between;
`;

const ClassInfo = styled.h2`
	display: flex;
	align-items: flex-end;
	margin-bottom: 10px;
`;

const ClassTitle = styled.h2`
	font-size: ${({ theme }) => theme.fontSizes.xxxlg};
	color: ${({ theme }) => theme.colors.title};
	margin-right: 10px;
`;

const ClassTeacher = styled.h4`
	font-size: 14px;
	color: #b6b6b6;
`;

const LeftBox = styled.div``;

const StateBox = styled.div`
	margin-top: 40px;
	display: flex;
`;

const MyStateBox = styled.div`
	width: 490px;
	height: 300px;
	margin-right: 22px;
`;

const UpperBox = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const MyName = styled.h2`
	font-size: 24px;
	font-weight: bold;
`;

const MyStateCharacter = styled.div<{ src: string }>`
	background-image: url(${({ src }) => src});
	background-position: left center;
	background-repeat: no-repeat;
	width: 300px;
	height: 300px;
`;

const StateButtons = styled.div`
	width: 276px;
	height: 72px;
	border-radius: 7px;
	box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
	display: flex;
	align-items: center;
`;

const StateButton = styled.button<{ src: string }>`
	background: none;
	border: none;
	background-image: url(${({ src }) => src});
	background-position: center center;
	background-repeat: no-repeat;
	width: 90px;
	height: 72px;
	cursor: pointer;
`;

const Hr = styled.hr`
	border: none;
	border-radius: 1px;
	width: 2px;
	height: 30px;
	background-color: #d2d2d2;
`;

const StudentStateBox = styled.div`
	width: 380px;
	height: 300px;
	border-radius: 10px;
	box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
	display: flex;
	flex-wrap: nowrap;
	padding: 35px;
`;

const StudentBox = styled.div`
	height: 63px;
	width: 50px;
	flex: 0;
	& + & {
		margin-left: 35px;
	}
`;

const StudentName = styled.h4`
	font-size: 12px;
	font-weight: bold;
	text-align: center;
	margin-bottom: 8px;
`;

const StudentState = styled.div<{ src: string }>`
	background-image: url(${({ src }) => src});
	background-position: center center;
	background-repeat: no-repeat;
	width: 50px;
	height: 50px;
`;