package com.tinyarcade.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 공통 오류 코드 목록 (03_10_tinyarcade_auth §3). 새 기능의 오류 코드는 아래에 추가만 한다.
 */
@Getter
public enum ErrorCode {

    // 공통
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 주소를 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "허용되지 않은 요청 방식입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    // 인증 (10)
    AGE_NOT_CONFIRMED(HttpStatus.BAD_REQUEST, "만 14세 이상만 가입할 수 있습니다."),
    EMAIL_DUPLICATE(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."),
    NICKNAME_DUPLICATE(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
    // 이메일이 없든 비밀번호가 틀리든 같은 메시지 → 어느 쪽이 틀렸는지 알려 주지 않는다 (AUTH-N05)
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    USER_NOT_ACTIVE(HttpStatus.FORBIDDEN, "이용이 정지되었거나 탈퇴한 계정입니다."),

    // 추천·비추천 (재사용 보존)
    VOTE_CONFLICT(HttpStatus.CONFLICT, "투표가 동시에 처리되었습니다. 잠시 후 다시 시도해 주세요."),

    // 게시판 (19)
    BOARD_NOT_FOUND(HttpStatus.NOT_FOUND, "게시판을 찾을 수 없습니다."),
    BOARD_CODE_DUPLICATE(HttpStatus.CONFLICT, "이미 사용 중인 게시판 코드명입니다."),
    BOARD_NAME_DUPLICATE(HttpStatus.CONFLICT, "이미 사용 중인 게시판 메뉴명입니다."),
    RESERVED_BOARD_CODE(HttpStatus.BAD_REQUEST, "사용할 수 없는 예약 코드명입니다."),
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."),
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),
    INVALID_GUEST_PASSWORD(HttpStatus.FORBIDDEN, "작성 시 입력한 비밀번호가 일치하지 않습니다.");

    private final HttpStatus status;  // 401, 409 같은 HTTP 상태
    private final String message;     // 화면에 보여 줄 기본 문장

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
