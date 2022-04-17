import { ChangeEvent, MouseEvent, useRef, useState } from 'react';
import styled from 'styled-components';
import api from '../../api';
import ModalCloseButton from './ModalCloseButton';
import AWS from 'aws-sdk';
import { useMutation, useQueryClient } from 'react-query';
import { useDispatch } from 'react-redux';
import { closeModal } from '../../store/modules/modal';
import axios from 'axios';

const AddClass = () => {
	const queryClient = useQueryClient();
	const dispatch = useDispatch();
	const [selectedDays, setSelectedDays] = useState<
		{ id: number; day: number; startTime: string; endTime: string }[]
	>([]);
	const [inputs, setInputs] = useState({
		title: '',
		imageUrl: '',
		startDate: '',
		endDate: '',
		day: '',
		startTime: '',
		endTime: '',
	});

	//image
	const [file, setFile] = useState<any>('');
	const [isImage, setIsImage] = useState(false);
	const count = useRef(0);

	const days = ['월', '화', '수', '목', '금', '토', '일'];

	const ACCESS_KEY = process.env.REACT_APP_ACCESS_KEY;
	const SECRET_ACCESS_KEY = process.env.REACT_APP_SECRET_ACCESS_KEY;
	const REGION = process.env.REACT_APP_REGION;

	AWS.config.update({
		accessKeyId: ACCESS_KEY,
		secretAccessKey: SECRET_ACCESS_KEY,
	});

	const myBucket = new AWS.S3({
		params: { Bucket: process.env.REACT_APP_IMAGE_BUCKET },
		region: REGION,
	});

	const uploadFile = () => {
		if (
			inputs.title != '' &&
			inputs.startDate != '' &&
			inputs.endDate != '' &&
			selectedDays != []
		) {
			const params = {
				ACL: 'public-read',
				Body: file,
				Bucket: process.env.REACT_APP_IMAGE_BUCKET as string,
				Key: 'upload/' + file.name,
			};
			myBucket
				.putObject(params)
				.on('httpUploadProgress', (evt: any, res: any) => {
					console.log('Uploaded : ' + (evt.loaded * 100) / evt.total) + '%';
					setInputs({
						...inputs,
						imageUrl:
							'https://mywoo1031bucket.s3.ap-northeast-2.amazonaws.com' +
							res.request.httpRequest.path,
					});
				})
				.on('httpDone', (res: any) => {
					const newUrl: string =
						'https://mywoo1031bucket.s3.ap-northeast-2.amazonaws.com' +
						res.request.httpRequest.path;
					createClass(newUrl);
				})
				.send((err) => {
					if (err) console.log(err, 'err');
				});
		} else {
			alert('작성이 완료되지 않았습니다.');
		}
	};

	const { mutate: createClass } = useMutation(
		(url: string) =>
			api.createClass({ ...inputs, times: selectedDays, imageUrl: url }),
		{
			onSuccess: () => {
				queryClient.invalidateQueries('teachCard');
				dispatch(closeModal());
			},
			onError: (error) => {
				if (axios.isAxiosError(error)) {
					alert(error.response?.data.message);
				}
			},
		}
	);

	const onChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setInputs({ ...inputs, [name]: value });
	};

	const addDays = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		const newArr = [
			...selectedDays,
			{
				id: count.current,
				day: parseInt(inputs.day),
				startTime: inputs.startTime,
				endTime: inputs.endTime,
			},
		];
		count.current += 1;
		newArr.sort((a, b) => (a.day > b.day ? 1 : -1));
		setSelectedDays(newArr);
		console.log(selectedDays);
	};

	const deleteDay = (id: number) => {
		setSelectedDays(selectedDays.filter((day) => day.id !== id));
	};

	const handleFileOnChange = (e: any) => {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.onloadend = () => {
			setFile(file);
			const csv = reader.result as string;
			setInputs({ ...inputs, ['imageUrl']: csv });
			setIsImage(true);
		};
		if (file) {
			reader.readAsDataURL(file);
		}
	};

	return (
		<Container>
			<ModalCloseButton />
			<h2>클래스 개설하기</h2>
			<TopContainer>
				<p>강의 이름</p>
				<Input type='text' name='title' onChange={onChange} />
			</TopContainer>
			<UpperContainer>
				<UpperLeft>
					<Days>
						<p>시작일</p>
						<InputDay type='date' name='startDate' onChange={onChange} />
					</Days>
					<Days>
						<p>종료일</p>
						<InputDay type='date' name='endDate' onChange={onChange} />
					</Days>
				</UpperLeft>
				<UpperRight>
					<p>사진 추가하기</p>
					<FileLabel htmlFor='file' src={inputs.imageUrl}>
						{isImage || <CrossButton />}
					</FileLabel>
					<FileInput type='file' id='file' onChange={handleFileOnChange} />
				</UpperRight>
			</UpperContainer>

			<LowerContainer>
				<AddBox>
					<BoxLeft>
						<DayList>
							{selectedDays?.map((item) => (
								<DayNum key={item.id}>
									{days[item.day - 1]} [{item.startTime}~{item.endTime}]
									<DayButton
										src='/images/closeday.png'
										onClick={() => deleteDay(item.id)}
									/>
								</DayNum>
							))}
						</DayList>
					</BoxLeft>
					<BoxRight>
						<p>요일 선택</p>
						<DayContainer>
							<DayBox>
								{[1, 2, 3, 4, 5, 6, 7].map((day) => (
									<RadioBox key={day}>
										<Radio
											type='radio'
											name='day'
											value={day}
											onChange={onChange}
											id={days[day - 1]}
										/>
										<Label htmlFor={days[day - 1]}>{days[day - 1]}</Label>
									</RadioBox>
								))}
							</DayBox>

							<Button onClick={addDays}>추가</Button>
						</DayContainer>
						<InputDays>
							<Days>
								<p>시작 시간</p>
								<InputDay type='time' name='startTime' onChange={onChange} />
							</Days>
							<Days>
								<p>종료 시간</p>
								<InputDay type='time' name='endTime' onChange={onChange} />
							</Days>
						</InputDays>
					</BoxRight>
				</AddBox>
			</LowerContainer>
			<Footer>
				<AddButton onClick={uploadFile}>개설하기</AddButton>
			</Footer>
		</Container>
	);
};

export default AddClass;

const Container = styled.div`
	width: 560px;
	height: 600px;
	display: flex;
	flex-direction: column;
	padding: 40px 50px 30px 50px;
`;

const TopContainer = styled.div`
	margin-top: 10px;
`;

const UpperContainer = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
`;
const Days = styled.div`
	margin-right: 10px;
	margin-top: 5px;
`;

const InputDays = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	margin-top: 5px;
`;
const RadioBox = styled.div``;

const Radio = styled.input`
	display: none;
	&:checked + Label {
		color: ${({ theme }) => theme.colors.main};
		font-weight: 600;
	}
`;
const Label = styled.label`
	margin-right: 5px;
	cursor: pointer;
`;

const UpperLeft = styled.div`
	width: 250px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`;

const UpperRight = styled.div`
	width: 180px;
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	margin-top: 10px;
`;
const FileInput = styled.input`
	position: absolute;
	width: 0;
	height: 0;
	padding: 0;
	overflow: hidden;
	border: 0;
`;
const FileLabel = styled.label<{ src: string }>`
	background-image: url(${({ src }) => src});
	${({ theme }) => theme.commons.backgroundImage};
	background-size: contain;
	background-color: ${({ theme }) => theme.colors.base};
	width: 100%;
	height: 100%;
	border-radius: 5px;
	cursor: pointer;
	transition: 0.2s;
	&:hover {
		background-color: ${({ theme }) => theme.colors.hoverBase};
	}
	&:active {
		background-color: ${({ theme }) => theme.colors.activeBase};
	}
`;

const CrossButton = styled.div`
	border: none;
	background: none;
	background-image: url('images/crossbutton.png');
	background-repeat: no-repeat;
	background-position: center center;
	background-size: contain;
	width: 20px;
	height: 20px;
	top: 50%;
	left: 43%;
	position: absolute;
	cursor: pointer;
`;

const LowerContainer = styled.div`
	margin-top: 30px;
`;
const BoxRight = styled.div`
	margin-left: 10px;
`;

const BoxLeft = styled.div`
	width: 180px;
	height: 100%;
`;

const DayList = styled.div`
	display: flex;
	height: 100%;
	flex-direction: column;
	overflow: auto;
	&::-webkit-scrollbar {
		width: 5px;
	}
	&::-webkit-scrollbar-thumb {
		border-radius: 10px;
		background-color: ${({ theme }) => theme.colors.scroll};
	}
	&::-webkit-scrollbar-thumb:hover {
		background-color: ${({ theme }) => theme.colors.scrollHover};
	}
`;

const DayNum = styled.li`
	width: 160px;
	height: 30px;
	padding: 3px;
	border-radius: 10px;
	margin: 5px 0;
	text-align: center;
	align-items: center;
	${({ theme }) => theme.commons.mainButton};
	color: ${({ theme }) => theme.colors.buttonTitle};
`;

const DayButton = styled.button<{ src: string }>`
	background-image: url(${({ src }) => src});
	background-repeat: no-repeat;
	background-position: center center;
	background-size: contain;
	width: 10px;
	height: 10px;
	margin-left: 5px;
`;

const AddBox = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	padding: 15px;
	height: 220px;
	background-color: ${({ theme }) => theme.colors.base};
`;

const DayContainer = styled.div`
	display: flex;
	flex-direction: row;
`;

const DayBox = styled.div`
	display: flex;
	padding: 5px;
	width: 160px;
	height: 30px;
	border-radius: 7px;
	align-items: center;
	justify-content: center;
	background-color: ${({ theme }) => theme.colors.background};
`;

const Input = styled.input`
	width: 100%;
	height: 30px;
	border-radius: 7px;
	background-color: ${({ theme }) => theme.colors.base};
	font-size: 14px;
	padding-left: 20px;
`;

const InputDay = styled.input<{ type?: 'time' | 'date' }>`
	width: 100%;
	height: 30px;
	border-radius: 7px;
	background-color: ${({ theme }) => theme.colors.base};
	${({ type }) => type === 'time' && 'background-color: #FFF; color: #000;'}
	font-size: 14px;
	padding-left: 20px;
	margin-top: 5px;
`;

const Footer = styled.div`
	margin-top: 20px;
	display: flex;
	justify-content: flex-end;
`;

const Button = styled.button`
	width: 70px;
	height: 30px;
	border-radius: 7px;
	background-color: ${({ theme }) => theme.colors.main};
	color: ${({ theme }) => theme.colors.buttonTitle};
	font-size: 12px;
	font-weight: 600;
	margin: 0 10px;
	transition: 0.3s;
	&:hover {
		filter: brightness(110%);
	}
	&:active {
		filter: brightness(90%);
	}
`;

const AddButton = styled(Button)`
	width: 165px;
	height: 35px;
`;
