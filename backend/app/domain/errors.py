class DomainError(Exception):
    pass


class InvalidTransitionError(DomainError):
    pass


class ResourceNotFoundError(DomainError):
    pass


class ResourceConflictError(DomainError):
    pass


class InvalidCredentialsError(DomainError):
    pass


class InactiveAccountError(DomainError):
    pass


class PersistenceConflictError(Exception):
    pass
