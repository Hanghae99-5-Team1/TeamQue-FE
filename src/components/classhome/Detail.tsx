import axios from 'axios';
import { ChangeEvent, MouseEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../api';
import { RootState } from '../../store/configStore';

const Detail = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const userId = useSelector((state: RootState) => state.user.id);
	const { classid, postid } = useParams();
	const [comment, setComment] = useState('');

	const { data } = useQuery('post', () => api.loadPost(postid as string));
	const { mutate: removePost } = useMutation(
		() => api.deletePost(postid as string),
		{
			onSuccess: () => {
				queryClient.invalidateQueries('posts');
			},
			onError: (error) => {
				if (axios.isAxiosError(error)) {
					alert(error.response?.data.message);
				}
			},
		}
	);

	const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		setComment(e.target.value);
	};

	const deletePost = () => {
		if (confirm('정말로 삭제 하실건가요?')) {
			removePost();
			navigate(`/classhome/${classid}/1`);
		}
	};

	const { mutate: addComment } = useMutation(
		() => api.addComment(postid as string, comment),
		{
			onSuccess: () => {
				queryClient.invalidateQueries('post');
				setComment('');
			},
			onError: (error) => {
				if (axios.isAxiosError(error)) {
					alert(error.response?.data.message);
				}
			},
		}
	);

	const deleteComment = (commentId: number) => {
		if (confirm('정말로 삭제 하실건가요?')) {
			deleteCommentMutate(commentId);
		}
	};

	const { mutate: deleteCommentMutate } = useMutation(
		(commentId: number) => api.deleteComment(commentId),
		{
			onSuccess: () => {
				queryClient.invalidateQueries('post');
			},
			onError: (error) => {
				if (axios.isAxiosError(error)) {
					alert(error.response?.data.message);
				}
			},
		}
	);

	const onBack = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		navigate(-1);
	};

	return (
		<Container>
			<PostHeader>
				<BackButton onClick={onBack} />
				<TypeOfPost>{data?.postType}</TypeOfPost>
				<PostTitle>{data?.title}</PostTitle>
				<Author>{data?.author}</Author>
				<Date>{data?.createdAt.split('T')[0].replaceAll('-', '.')}</Date>
				{data && data?.userId === userId && (
					<>
						<UpdateButton
							onClick={() => {
								navigate(`/classhome/${classid}/update/${data.id}`, {
									state: {
										title: data?.title,
										content: data?.content,
										postType: data?.postType,
									},
								});
							}}
						/>
						<RemoveButton onClick={deletePost} />
					</>
				)}
			</PostHeader>
			<Contents>{data?.content}</Contents>
			<CommentTitle>댓글</CommentTitle>
			<Comments>
				<CommentBox>
					<CommentInput onChange={onChange} value={comment} />
					<CommentButton onClick={() => addComment()}>등록</CommentButton>
				</CommentBox>
				{data?.comments?.map((comment) => (
					<Commentlist key={comment.id}>
						<CommentWriter>
							{comment.author}
							{comment.userId === userId && ' (나)'}
						</CommentWriter>
						<Comment>{comment.content}</Comment>
						<CommentTime>
							{comment.createdAt.split('T')[0].replaceAll('-', '.')}
						</CommentTime>
						{comment.userId === userId && (
							<button
								onClick={() => {
									deleteComment(comment.id);
								}}
							>
								삭제
							</button>
						)}
						<UnderLine />
					</Commentlist>
				))}
			</Comments>
		</Container>
	);
};

export default Detail;

const Container = styled.div`
	width: 890px;
	height: 850px;
	background-color: ${({ theme }) => theme.colors.background};
	border-radius: 10px;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
	overflow-y: scroll;
	&::-webkit-scrollbar {
		width: 12px;
	}
	&::-webkit-scrollbar-thumb {
		background-color: ${({ theme }) => theme.colors.scroll};
		border-radius: 10px;
	}
	&::-webkit-scrollbar-thumb:hover {
		background-color: ${({ theme }) => theme.colors.scrollHover};
	}
	z-index: 1;
`;

const PostHeader = styled.div`
	padding: 50px;
	position: relative;
`;

const TypeOfPost = styled.h3`
	font-size: 12px;
	color: ${({ theme }) => theme.colors.subTitle};
`;

const PostTitle = styled.h2`
	font-size: 30px;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.title};
`;

const Author = styled.h3`
	font-size: 12px;
	color: ${({ theme }) => theme.colors.subTitle};
	margin-top: 10px;
`;

const Date = styled.h3`
	font-size: 12px;
	color: ${({ theme }) => theme.colors.subTitle};
	margin-top: 10px;
`;

const Contents = styled.p`
	padding: 20px 50px;
	min-height: 350px;
	color: ${({ theme }) => theme.colors.title};
`;

const CommentTitle = styled.h2`
	margin-left: 50px;
	margin-bottom: 20px;
	color: ${({ theme }) => theme.colors.title};
`;

const Commentlist = styled.li`
	margin: 20px 20px 30px 20px;
	position: relative;
`;

const CommentWriter = styled.h4`
	font-size: 12px;
	font-weight: 800;
	margin-bottom: 5px;
	${({ theme }) => theme.colors.title};
`;

const Comment = styled.p`
	font-size: 12px;
`;

const UnderLine = styled.div`
	position: absolute;
	width: 775px;
	height: 0.5px;
	margin-top: 15px;
	left: -20px;
	background-color: ${({ theme }) => theme.colors.sub};
`;

const Comments = styled.div`
	background-color: ${({ theme }) => theme.colors.base};
	min-height: 200px;
	padding: 50px;
	position: relative;
`;

const CommentBox = styled.div`
	display: flex;
	position: relative;
`;

const CommentTime = styled.p`
	font-size: 10px;
	color: #626262;
`;

const CommentInput = styled.textarea`
	resize: none;
	border: none;
	outline: none;
	width: 800px;
	height: 130px;
	padding: 25px;
	border-radius: 10px;
	margin-bottom: 20px;
	font-size: ${({ theme }) => theme.fontSizes.base};
	background-color: ${({ theme }) => theme.colors.background};
	&::-webkit-scrollbar {
		width: 5px;
	}
	&::-webkit-scrollbar-thumb {
		background-color: ${({ theme }) => theme.colors.scroll};
		border-radius: 10px;
	}
	&::-webkit-scrollbar-thumb:hover {
		background-color: ${({ theme }) => theme.colors.scrollHover};
	}
`;

const CommentButton = styled.button`
	width: 50px;
	height: 25px;
	border-radius: 5px;
	${({ theme }) => theme.commons.mainButton};
	color: ${({ theme }) => theme.colors.buttonTitle};
	right: 30px;
	bottom: 30px;
	position: absolute;
	transition: 0.2s;
	&:hover {
		filter: brightness(105%);
	}
	&:active {
		filter: brightness(95%);
	}
`;

const Button = styled.button`
	${({ theme }) => theme.commons.backgroundImage};
	width: 16px;
	height: 18.22px;
	z-index: 2;
	display: inline-block;
	background-size: contain;
	transition: 0.2s;
	position: absolute;
	&:hover {
		filter: brightness(110%);
	}
	&:active {
		filter: brightness(90%);
	}
`;
const BackButton = styled.button`
	background-image: url('/images/back.png');
	top: 40px;
	left: 100px;
`;

const UpdateButton = styled(Button)`
	background-image: url('/images/edit.png');
	top: 40px;
	right: 100px;
`;

const RemoveButton = styled(Button)`
	background-image: url('/images/remove.png');
	top: 40px;
	right: 60px;
`;
