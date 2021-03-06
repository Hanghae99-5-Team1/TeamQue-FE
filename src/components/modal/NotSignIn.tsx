import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { openModal } from '../../store/modules/modal';

const NotSignIn = () => {
	const dispatch = useDispatch();

	const toSignIn = () => {
		dispatch(openModal('signIn'));
	};

	const toTutorial = () => {
		dispatch(openModal('tutorial'));
	};

	return (
		<Container>
			<Message>
				환영합니다, <br />
				<img src='/images/smallLogo.png' /> 입니다.
			</Message>
			<Button id='signIn' onClick={toSignIn}>
				큐하러 가기
			</Button>
			<LightButton onClick={toTutorial}>큐 둘러보기</LightButton>
			<Character />
		</Container>
	);
};

export default NotSignIn;

const Container = styled.div`
	width: 550px;
	height: 300px;
	padding: 40px 70px;
	position: relative;
`;

const Message = styled.h2`
	font-size: ${({ theme }) => theme.fontSizes.xxxlg};
	color: ${({ theme }) => theme.colors.title};
	margin-bottom: 30px;
`;

const Button = styled.button`
	width: 250px;
	height: 45px;
	border-radius: 7px;
	margin-top: 10px;
	display: block;
	border: none;
	color: ${({ theme }) => theme.colors.buttonTitle};
	font-size: 22px;
	font-weight: 500;
	cursor: pointer;
	transition: 0.2s;
	${({ theme }) => theme.commons.mainButton};
`;

const LightButton = styled(Button)`
	${({ theme }) => theme.commons.subButton};
`;

const Character = styled.div`
	background-image: url('/images/notsignin.png');
	background-position: center center;
	background-repeat: no-repeat;
	position: absolute;
	width: 155px;
	height: 160px;
	right: 50px;
	bottom: 30px;
`;
