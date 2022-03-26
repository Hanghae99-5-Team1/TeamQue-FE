import { useSelector } from 'react-redux';
import { RootState } from '../../store/configStore';
import styled from 'styled-components';

const Welcome = () => {
	const user = useSelector((state: RootState) => state.user);
	return (
		<Container>
			<WelcomeMessage>안녕하세요,</WelcomeMessage>
			<Name>{user.user_info.nickname} 님</Name>
			<MessageBox>
				<Message>명언 랜덤으로 들어가는 공간</Message>
			</MessageBox>
			<Character src='/images/character1.png' />
		</Container>
	);
};

export default Welcome;

const Container = styled.div`
	width: 580px;
	height: 290px;
	background-color: #fff;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
	border-radius: 7px;
	padding: 36px 40px;
	position: relative;
`;

const WelcomeMessage = styled.p`
	font-size: 30px;
	font-weight: 700;
	margin-bottom: -10px;
`;

const Name = styled.p`
	font-size: 30px;
	font-weight: 700;
`;

const MessageBox = styled.div`
	width: 350px;
	height: 85px;
	position: relative;
	background-color: #718aff;
	color: #fff;
	font-size: 18px;
	font-weight: 500;
	border-radius: 4px;
	padding: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: 20px;
`;

const Message = styled.p``;

const Character = styled.div<{ src: string }>`
	background-image: url(${({ src }) => src});
	width: 130px;
	height: 150px;
	position: absolute;
	bottom: 10px;
	right: 20px;
`;